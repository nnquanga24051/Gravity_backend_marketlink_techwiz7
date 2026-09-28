package com.gravity.marketlink.modules.market.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.market.dto.GeofenceCheckResponse;
import com.gravity.marketlink.modules.market.dto.RouteResponse;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.notification.service.NotificationService;
import com.gravity.marketlink.modules.order.entity.Order;
import com.gravity.marketlink.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketRoutingService {

    private final MarketRepository marketRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Geofencing trigger radius around market (300 meters)
    public static final double GEOFENCE_RADIUS_METERS = 300.0;
    private static final double EARTH_RADIUS_METERS = 6371000.0;

    // Open Source Routing Machine (OSRM) public community endpoint
    private static final String OSRM_ROUTING_BASE = "https://router.project-osrm.org/route/v1/driving/";

    // Cache to prevent duplicate consecutive notifications (15-minute cool-down)
    private final Map<String, LocalDateTime> alertCooldownCache = new ConcurrentHashMap<>();

    private final WebClient webClient = WebClient.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
            .build();

    /**
     * Finds nearest market (or by ID) and calculates shortest route via OpenStreetMap / OSRM
     */
    public Mono<RouteResponse> findNearestMarketAndRoute(Double userLat, Double userLon, Long specificMarketId) {
        if (userLat == null || userLon == null) {
            return Mono.error(new IllegalArgumentException("Your GPS coordinates cannot be null."));
        }

        Mono<Market> targetMarketMono;
        if (specificMarketId != null && specificMarketId > 0) {
            targetMarketMono = marketRepository.findById(specificMarketId)
                    .switchIfEmpty(Mono.error(new ResourceNotFoundException("Market not found with ID: " + specificMarketId)));
        } else {
            targetMarketMono = marketRepository.findByStatus("ACTIVE")
                    .collectList()
                    .flatMap(markets -> {
                        if (markets.isEmpty()) {
                            return Mono.error(new ResourceNotFoundException("There are currently no active markets open."));
                        }
                        // Use Haversine to find nearest market based on user coordinates
                        Market nearest = markets.stream()
                                .min(Comparator.comparingDouble(m -> calculateHaversine(
                                        userLat, userLon,
                                        m.getLatitude().doubleValue(),
                                        m.getLongitude().doubleValue())))
                                .orElse(markets.get(0));
                        return Mono.just(nearest);
                    });
        }

        return targetMarketMono.flatMap(market -> calculateOsrmRoute(userLat, userLon, market));
    }

    /**
     * Calls OSRM Engine (OpenStreetMap) to calculate shortest driving route
     */
    private Mono<RouteResponse> calculateOsrmRoute(double userLat, double userLon, Market market) {
        double mLat = market.getLatitude().doubleValue();
        double mLon = market.getLongitude().doubleValue();
        double straightDistance = calculateHaversine(userLat, userLon, mLat, mLon);
        boolean inGeofence = straightDistance <= GEOFENCE_RADIUS_METERS;

        // OSRM URL format: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
        String osrmUrl = String.format(Locale.US, "%s%.6f,%.6f;%.6f,%.6f?overview=full&geometries=geojson&steps=true",
                OSRM_ROUTING_BASE, userLon, userLat, mLon, mLat);

        String gmapsUrl = String.format(Locale.US, "https://www.google.com/maps/dir/?api=1&origin=%.6f,%.6f&destination=%.6f,%.6f&travelmode=driving",
                userLat, userLon, mLat, mLon);

        return webClient.get()
                .uri(osrmUrl)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(4))
                .flatMap(responseBody -> {
                    try {
                        JsonNode root = objectMapper.readTree(responseBody);
                        JsonNode routes = root.path("routes");
                        if (!routes.isArray() || routes.isEmpty()) {
                            return Mono.just(createFallbackRoute(userLat, userLon, market, straightDistance, inGeofence, gmapsUrl));
                        }

                        JsonNode primaryRoute = routes.get(0);
                        double distanceMeters = primaryRoute.path("distance").asDouble(straightDistance);
                        double durationSeconds = primaryRoute.path("duration").asDouble(distanceMeters / 8.33); // Default ~30km/h

                        // Extract route coordinates [ [lat, lon], [lat, lon], ... ]
                        List<List<Double>> geometryList = new ArrayList<>();
                        JsonNode coordinates = primaryRoute.path("geometry").path("coordinates");
                        if (coordinates.isArray()) {
                            for (JsonNode point : coordinates) {
                                // OSRM returns [lon, lat], convert back to [lat, lon] for Leaflet rendering
                                geometryList.add(List.of(point.get(1).asDouble(), point.get(0).asDouble()));
                            }
                        }

                        if (geometryList.isEmpty()) {
                            geometryList.add(List.of(userLat, userLon));
                            geometryList.add(List.of(mLat, mLon));
                        }

                        // Step-by-step turn directions
                        List<String> steps = new ArrayList<>();
                        JsonNode legs = primaryRoute.path("legs");
                        if (legs.isArray() && !legs.isEmpty()) {
                            JsonNode stepsNode = legs.get(0).path("steps");
                            if (stepsNode.isArray()) {
                                for (JsonNode step : stepsNode) {
                                    String name = step.path("name").asText("");
                                    double stepDist = step.path("distance").asDouble(0);
                                    String modifier = step.path("maneuver").path("modifier").asText("");
                                    String type = step.path("maneuver").path("type").asText("");

                                    String action = "Continue straight";
                                    if ("turn".equals(type) || "end of road".equals(type)) {
                                        if ("right".equalsIgnoreCase(modifier)) action = "Turn right";
                                        else if ("left".equalsIgnoreCase(modifier)) action = "Turn left";
                                        else if ("slight right".equalsIgnoreCase(modifier)) action = "Slight right";
                                        else if ("slight left".equalsIgnoreCase(modifier)) action = "Slight left";
                                    } else if ("arrive".equals(type)) {
                                        action = "Arrive at destination";
                                    }

                                    String instruction = String.format("%s %s (%.0f m)",
                                            action, name.isEmpty() ? "the road ahead" : "onto " + name, stepDist);
                                    steps.add(instruction);
                                }
                            }
                        }

                        if (steps.isEmpty()) {
                            steps.add(String.format("Depart from your location heading towards %s", market.getName()));
                            steps.add(String.format("Follow main road corridor to %s", market.getAddress()));
                            steps.add(String.format("Arrive at market gate %s", market.getName()));
                        }

                        double km = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
                        int minutes = (int) Math.max(1, Math.ceil(durationSeconds / 60.0));

                        return Mono.just(RouteResponse.builder()
                                .marketId(market.getMarketId())
                                .marketName(market.getName())
                                .marketAddress(market.getAddress())
                                .marketLatitude(mLat)
                                .marketLongitude(mLon)
                                .originLatitude(userLat)
                                .originLongitude(userLon)
                                .distanceKilometers(km)
                                .estimatedMinutes(minutes)
                                .routeGeometry(geometryList)
                                .navigationSteps(steps)
                                .googleMapsNavUrl(gmapsUrl)
                                .inGeofence(inGeofence)
                                .build());

                    } catch (Exception e) {
                        log.warn("OSRM JSON parsing error: {}, switching to fallback", e.getMessage());
                        return Mono.just(createFallbackRoute(userLat, userLon, market, straightDistance, inGeofence, gmapsUrl));
                    }
                })
                .onErrorResume(err -> {
                    log.info("OSRM timeout/offline, activating fallback routing: {}", err.getMessage());
                    return Mono.just(createFallbackRoute(userLat, userLon, market, straightDistance, inGeofence, gmapsUrl));
                });
    }

    /**
     * Fallback route when external OSRM service is unavailable
     */
    private RouteResponse createFallbackRoute(double userLat, double userLon, Market market,
                                              double distanceMeters, boolean inGeofence, String gmapsUrl) {
        double km = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
        int minutes = (int) Math.max(1, Math.ceil(km * 2.5)); // Assumes average speed of 24 km/h

        List<List<Double>> fallbackGeo = new ArrayList<>();
        // Generate 5 intermediate curved waypoints for a natural polyline path
        int stepsCount = 6;
        for (int i = 0; i <= stepsCount; i++) {
            double ratio = (double) i / stepsCount;
            double lat = userLat + (market.getLatitude().doubleValue() - userLat) * ratio;
            double lon = userLon + (market.getLongitude().doubleValue() - userLon) * ratio;
            // Add subtle natural curvature offset at intermediate points
            if (i > 0 && i < stepsCount) {
                lat += (i % 2 == 0 ? 0.0008 : -0.0008);
            }
            fallbackGeo.add(List.of(lat, lon));
        }

        List<String> steps = List.of(
                String.format("Depart from current location heading towards %s", market.getName()),
                String.format("Follow shortest path approximately %.1f km", km),
                String.format("Arrive at market entrance: %s", market.getAddress())
        );

        return RouteResponse.builder()
                .marketId(market.getMarketId())
                .marketName(market.getName())
                .marketAddress(market.getAddress())
                .marketLatitude(market.getLatitude().doubleValue())
                .marketLongitude(market.getLongitude().doubleValue())
                .originLatitude(userLat)
                .originLongitude(userLon)
                .distanceKilometers(km)
                .estimatedMinutes(minutes)
                .routeGeometry(fallbackGeo)
                .navigationSteps(steps)
                .googleMapsNavUrl(gmapsUrl)
                .inGeofence(inGeofence)
                .build();
    }

    /**
     * Checks geofencing proximity (300m radius) and triggers real-time notification
     */
    public Mono<GeofenceCheckResponse> checkGeofence(String userEmail, Double userLat, Double userLon, Long targetMarketId) {
        if (userLat == null || userLon == null) {
            return Mono.error(new IllegalArgumentException("GPS coordinates cannot be null."));
        }

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found: " + userEmail)))
                .flatMap(user -> {
                    Mono<Market> targetMarketMono = (targetMarketId != null && targetMarketId > 0)
                            ? marketRepository.findById(targetMarketId)
                            : marketRepository.findByStatus("ACTIVE").collectList().map(list -> {
                                if (list.isEmpty()) throw new ResourceNotFoundException("No active farmers markets open");
                                return list.stream()
                                        .min(Comparator.comparingDouble(m -> calculateHaversine(userLat, userLon, m.getLatitude().doubleValue(), m.getLongitude().doubleValue())))
                                        .orElse(list.get(0));
                            });

                    return targetMarketMono.flatMap(market -> {
                        double distance = calculateHaversine(userLat, userLon, market.getLatitude().doubleValue(), market.getLongitude().doubleValue());
                        boolean inGeofence = distance <= GEOFENCE_RADIUS_METERS;

                        if (!inGeofence) {
                            return Mono.just(GeofenceCheckResponse.builder()
                                    .inGeofence(false)
                                    .distanceMeters(Math.round(distance * 10.0) / 10.0)
                                    .marketId(market.getMarketId())
                                    .marketName(market.getName())
                                    .alertMessage(String.format("You are %s approximately %.0f meters away (Outside 300m Geofence zone).", market.getName(), distance))
                                    .notifiedFarmersCount(0)
                                    .todayOrderCodes(Collections.emptyList())
                                    .build());
                        }

                        // When user enters 300m radius
                        String cooldownKey = user.getUserId() + "_" + market.getMarketId();
                        boolean alreadyAlerted = alertCooldownCache.containsKey(cooldownKey) &&
                                Duration.between(alertCooldownCache.get(cooldownKey), LocalDateTime.now()).toMinutes() < 15;

                        // Find customer orders
                        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(user.getUserId())
                                .filter(o -> market.getMarketId().equals(o.getMarketId()))
                                .filter(o -> !"CANCELLED".equals(o.getOrderStatus()) && !"DECLINED".equals(o.getOrderStatus()))
                                .collectList()
                                .flatMap(orders -> {
                                    List<String> orderCodes = orders.stream().map(Order::getOrderCode).toList();

                                    if (alreadyAlerted) {
                                        return Mono.just(GeofenceCheckResponse.builder()
                                                .inGeofence(true)
                                                .distanceMeters(Math.round(distance * 10.0) / 10.0)
                                                .marketId(market.getMarketId())
                                                .marketName(market.getName())
                                                .alertMessage(String.format("Welcome to %s! Your pre-orders are ready for pickup at the stall.", market.getName()))
                                                .notifiedFarmersCount(0)
                                                .todayOrderCodes(orderCodes)
                                                .build());
                                    }

                                    // Record timestamp of sent notification
                                    alertCooldownCache.put(cooldownKey, LocalDateTime.now());

                                    // 1. Create notification for Customer
                                    String custMsg = String.format("Welcome to %s (%.0fm away)! Please proceed to your appointed stall to collect fresh produce.", market.getName(), distance);
                                    Mono<Void> notifCust = notificationService.createNotification(
                                            user.getUserId(),
                                            "📍 You have arrived at the farmers market!",
                                            custMsg,
                                            "SYSTEM",
                                            market.getMarketId()
                                    ).then();

                                    // 2. Create notification for Farmers with customer orders
                                    Set<Long> notifiedFarmers = new HashSet<>();
                                    List<Mono<Void>> farmerNotifs = new ArrayList<>();

                                    for (Order order : orders) {
                                        if (notifiedFarmers.add(order.getFarmerId())) {
                                            String farmerMsg = String.format("Customer %s (Order #%s) just arrived at the market gate (%.0fm away). Please get their produce basket ready!",
                                                    user.getFullName(), order.getOrderCode(), distance);
                                            farmerNotifs.add(notificationService.createNotification(
                                                    order.getFarmerId(),
                                                    "🔔 Customer entering the market!",
                                                    farmerMsg,
                                                    "ORDER_READY",
                                                    order.getOrderId()
                                            ).then());
                                        }
                                    }

                                    return Mono.when(notifCust, Mono.when(farmerNotifs))
                                            .thenReturn(GeofenceCheckResponse.builder()
                                                    .inGeofence(true)
                                                    .distanceMeters(Math.round(distance * 10.0) / 10.0)
                                                    .marketId(market.getMarketId())
                                                    .marketName(market.getName())
                                                    .alertMessage(custMsg)
                                                    .notifiedFarmersCount(notifiedFarmers.size())
                                                    .todayOrderCodes(orderCodes)
                                                    .build());
                                });
                    });
                });
    }

    /**
     * Haversine formula to calculate approximate great-circle distance on Earth (meters)
     */
    public double calculateHaversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
