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

    // Bán kính kích hoạt Geofencing quanh phiên chợ (300 mét)
    public static final double GEOFENCE_RADIUS_METERS = 300.0;
    private static final double EARTH_RADIUS_METERS = 6371000.0;

    // Open Source Routing Machine (OSRM) công khai của cộng đồng OpenStreetMap
    private static final String OSRM_ROUTING_BASE = "https://router.project-osrm.org/route/v1/driving/";

    // Bộ nhớ đệm chống gửi thông báo lặp lại liên tục (cool-down 15 phút)
    private final Map<String, LocalDateTime> alertCooldownCache = new ConcurrentHashMap<>();

    private final WebClient webClient = WebClient.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
            .build();

    /**
     * Tìm chợ gần nhất (hoặc theo ID) và tính toán lộ trình đường đi ngắn nhất bằng OpenStreetMap / OSRM
     */
    public Mono<RouteResponse> findNearestMarketAndRoute(Double userLat, Double userLon, Long specificMarketId) {
        if (userLat == null || userLon == null) {
            return Mono.error(new IllegalArgumentException("Toạ độ GPS của bạn không được để trống."));
        }

        Mono<Market> targetMarketMono;
        if (specificMarketId != null && specificMarketId > 0) {
            targetMarketMono = marketRepository.findById(specificMarketId)
                    .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy chợ với ID: " + specificMarketId)));
        } else {
            targetMarketMono = marketRepository.findByStatus("ACTIVE")
                    .collectList()
                    .flatMap(markets -> {
                        if (markets.isEmpty()) {
                            return Mono.error(new ResourceNotFoundException("Hiện không có phiên chợ nào đang mở cửa."));
                        }
                        // Dùng Haversine tìm chợ gần nhất theo toạ độ người dùng
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
     * Gọi OSRM Engine (OpenStreetMap) tính toán đường đi xe máy/ô tô ngắn nhất
     */
    private Mono<RouteResponse> calculateOsrmRoute(double userLat, double userLon, Market market) {
        double mLat = market.getLatitude().doubleValue();
        double mLon = market.getLongitude().doubleValue();
        double straightDistance = calculateHaversine(userLat, userLon, mLat, mLon);
        boolean inGeofence = straightDistance <= GEOFENCE_RADIUS_METERS;

        // Định dạng URL OSRM: /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
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
                        double durationSeconds = primaryRoute.path("duration").asDouble(distanceMeters / 8.33); // Mặc định ~30km/h

                        // Giải nén các toạ độ tuyến đường [ [lat, lon], [lat, lon], ... ]
                        List<List<Double>> geometryList = new ArrayList<>();
                        JsonNode coordinates = primaryRoute.path("geometry").path("coordinates");
                        if (coordinates.isArray()) {
                            for (JsonNode point : coordinates) {
                                // OSRM trả về [lon, lat], chuyển lại thành [lat, lon] để vẽ trên Leaflet
                                geometryList.add(List.of(point.get(1).asDouble(), point.get(0).asDouble()));
                            }
                        }

                        if (geometryList.isEmpty()) {
                            geometryList.add(List.of(userLat, userLon));
                            geometryList.add(List.of(mLat, mLon));
                        }

                        // Danh sách chỉ dẫn chặng rẽ
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

                                    String action = "Đi thẳng";
                                    if ("turn".equals(type) || "end of road".equals(type)) {
                                        if ("right".equalsIgnoreCase(modifier)) action = "Rẽ phải";
                                        else if ("left".equalsIgnoreCase(modifier)) action = "Rẽ trái";
                                        else if ("slight right".equalsIgnoreCase(modifier)) action = "Chếch sang phải";
                                        else if ("slight left".equalsIgnoreCase(modifier)) action = "Chếch sang trái";
                                    } else if ("arrive".equals(type)) {
                                        action = "Đến nơi tại";
                                    }

                                    String instruction = String.format("%s %s (%.0f m)",
                                            action, name.isEmpty() ? "đoạn đường phía trước" : "vào " + name, stepDist);
                                    steps.add(instruction);
                                }
                            }
                        }

                        if (steps.isEmpty()) {
                            steps.add(String.format("Khởi hành từ vị trí của bạn hướng về %s", market.getName()));
                            steps.add(String.format("Đi theo tuyến đường chính tới %s", market.getAddress()));
                            steps.add(String.format("Đến cổng phiên chợ %s", market.getName()));
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
                        log.warn("Lỗi phân tích JSON OSRM: {}, chuyển sang dự phòng", e.getMessage());
                        return Mono.just(createFallbackRoute(userLat, userLon, market, straightDistance, inGeofence, gmapsUrl));
                    }
                })
                .onErrorResume(err -> {
                    log.info("OSRM không phản hồi kịp (timeout/offline), kích hoạt đường dự phòng: {}", err.getMessage());
                    return Mono.just(createFallbackRoute(userLat, userLon, market, straightDistance, inGeofence, gmapsUrl));
                });
    }

    /**
     * Tuyến đường dự phòng khi không có kết nối internet ngoại vi OSRM
     */
    private RouteResponse createFallbackRoute(double userLat, double userLon, Market market,
                                              double distanceMeters, boolean inGeofence, String gmapsUrl) {
        double km = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
        int minutes = (int) Math.max(1, Math.ceil(km * 2.5)); // Giả định vận tốc trung bình 24 km/h

        List<List<Double>> fallbackGeo = new ArrayList<>();
        // Sinh 5 điểm trung gian uốn lượn nhẹ để vẽ đường polyline tự nhiên
        int stepsCount = 6;
        for (int i = 0; i <= stepsCount; i++) {
            double ratio = (double) i / stepsCount;
            double lat = userLat + (market.getLatitude().doubleValue() - userLat) * ratio;
            double lon = userLon + (market.getLongitude().doubleValue() - userLon) * ratio;
            // Thêm chút độ lệch tự nhiên ở các điểm giữa
            if (i > 0 && i < stepsCount) {
                lat += (i % 2 == 0 ? 0.0008 : -0.0008);
            }
            fallbackGeo.add(List.of(lat, lon));
        }

        List<String> steps = List.of(
                String.format("Khởi hành từ vị trí hiện tại hướng về %s", market.getName()),
                String.format("Đi theo tuyến đường ngắn nhất khoảng %.1f km", km),
                String.format("Đến cổng chợ tại: %s", market.getAddress())
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
     * Kiểm tra định vị Geofencing (bán kính 300m) và bắn thông báo thời gian thực
     */
    public Mono<GeofenceCheckResponse> checkGeofence(String userEmail, Double userLat, Double userLon, Long targetMarketId) {
        if (userLat == null || userLon == null) {
            return Mono.error(new IllegalArgumentException("Toạ độ GPS không được để trống."));
        }

        return userRepository.findByEmail(userEmail)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản: " + userEmail)))
                .flatMap(user -> {
                    Mono<Market> targetMarketMono = (targetMarketId != null && targetMarketId > 0)
                            ? marketRepository.findById(targetMarketId)
                            : marketRepository.findByStatus("ACTIVE").collectList().map(list -> {
                                if (list.isEmpty()) throw new ResourceNotFoundException("Không có chợ đang hoạt động");
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
                                    .alertMessage(String.format("Bạn đang cách %s khoảng %.0f mét (Ngoài vùng Geofence 300m).", market.getName(), distance))
                                    .notifiedFarmersCount(0)
                                    .todayOrderCodes(Collections.emptyList())
                                    .build());
                        }

                        // Khi đã bước vào bán kính 300m
                        String cooldownKey = user.getUserId() + "_" + market.getMarketId();
                        boolean alreadyAlerted = alertCooldownCache.containsKey(cooldownKey) &&
                                Duration.between(alertCooldownCache.get(cooldownKey), LocalDateTime.now()).toMinutes() < 15;

                        // Tìm các đơn hàng của khách
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
                                                .alertMessage(String.format("Chào mừng bạn đã đến %s! Các đơn hàng của bạn đã sẵn sàng nhận tại sạp.", market.getName()))
                                                .notifiedFarmersCount(0)
                                                .todayOrderCodes(orderCodes)
                                                .build());
                                    }

                                    // Đánh dấu thời gian đã gửi thông báo
                                    alertCooldownCache.put(cooldownKey, LocalDateTime.now());

                                    // 1. Tạo thông báo cho Khách hàng
                                    String custMsg = String.format("Chào mừng bạn đã đến %s (cách %.0fm)! Vui lòng tới sạp đã hẹn để nhận nông sản tươi.", market.getName(), distance);
                                    Mono<Void> notifCust = notificationService.createNotification(
                                            user.getUserId(),
                                            "📍 Bạn đã đến phiên chợ!",
                                            custMsg,
                                            "SYSTEM",
                                            market.getMarketId()
                                    ).then();

                                    // 2. Tạo thông báo cho các Nông dân có đơn của khách
                                    Set<Long> notifiedFarmers = new HashSet<>();
                                    List<Mono<Void>> farmerNotifs = new ArrayList<>();

                                    for (Order order : orders) {
                                        if (notifiedFarmers.add(order.getFarmerId())) {
                                            String farmerMsg = String.format("Khách hàng %s (Đơn #%s) vừa đến cổng chợ (cách %.0fm). Hãy soạn sẵn giỏ nông sản!",
                                                    user.getFullName(), order.getOrderCode(), distance);
                                            farmerNotifs.add(notificationService.createNotification(
                                                    order.getFarmerId(),
                                                    "🔔 Khách hàng đang tiến vào chợ!",
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
     * Công thức Haversine tính khoảng cách đường vòng cung trên Trái Đất (mét)
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
