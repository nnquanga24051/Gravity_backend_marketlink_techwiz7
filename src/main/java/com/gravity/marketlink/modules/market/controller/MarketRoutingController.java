package com.gravity.marketlink.modules.market.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.market.dto.GeofenceCheckRequest;
import com.gravity.marketlink.modules.market.dto.GeofenceCheckResponse;
import com.gravity.marketlink.modules.market.dto.RouteResponse;
import com.gravity.marketlink.modules.market.service.MarketRoutingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Tag(name = "5. Farmers Markets & Map Routing", description = "APIs for shortest route navigation via OpenStreetMap and Geofencing detection")
@RestController
@RequiredArgsConstructor
public class MarketRoutingController {

    private final MarketRoutingService routingService;

    @Operation(summary = "Find nearest market & calculate route via OpenStreetMap (OSRM)",
               description = "Finds nearest market from user GPS coordinates and calculates travel distance, duration, GeoJSON route, and turn-by-turn directions.")
    @GetMapping("/api/markets/nearest-and-route")
    public Mono<ResponseEntity<ApiResponse<RouteResponse>>> getNearestMarketRoute(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Long marketId) {
        return routingService.findNearestMarketAndRoute(latitude, longitude, marketId)
                .map(route -> ResponseEntity.ok(ApiResponse.success("Route to market calculated successfully via OpenStreetMap.", route)));
    }

    @Operation(summary = "Check market Geofencing zone (300m) and alert stalls",
               description = "When customer enters 300m radius around market, system alerts customer and triggers order preparation notification for stalls.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/api/customer/geofence/check-in")
    public Mono<ResponseEntity<ApiResponse<GeofenceCheckResponse>>> checkGeofenceCustomer(
            Authentication authentication,
            @Valid @RequestBody GeofenceCheckRequest request) {
        String email = authentication != null ? authentication.getName() : "customer@marketlink.vn";
        return routingService.checkGeofence(email, request.getLatitude(), request.getLongitude(), request.getTargetMarketId())
                .map(res -> ResponseEntity.ok(ApiResponse.success("Geofencing check completed successfully.", res)));
    }

    @Operation(summary = "Public Geofencing Demo Simulation",
               description = "Simulate GPS movement to verify chime alerts and 300m radius without login.")
    @PostMapping("/api/markets/geofence/simulate")
    public Mono<ResponseEntity<ApiResponse<GeofenceCheckResponse>>> simulateGeofence(
            @Valid @RequestBody GeofenceCheckRequest request) {
        return routingService.checkGeofence("customer@marketlink.vn", request.getLatitude(), request.getLongitude(), request.getTargetMarketId())
                .map(res -> ResponseEntity.ok(ApiResponse.success("Geofencing simulation successful.", res)));
    }
}
