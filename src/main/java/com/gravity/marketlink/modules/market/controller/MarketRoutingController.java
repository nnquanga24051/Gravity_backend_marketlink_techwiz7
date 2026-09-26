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

@Tag(name = "5. Chợ nông sản & Bản đồ (Markets & Schedules)", description = "Các API định tuyến đường đi ngắn nhất qua OpenStreetMap và phát hiện vùng địa lý Geofencing")
@RestController
@RequiredArgsConstructor
public class MarketRoutingController {

    private final MarketRoutingService routingService;

    @Operation(summary = "Tìm chợ gần nhất & tính toán lộ trình ngắn nhất qua OpenStreetMap (OSRM)",
               description = "Dựa trên toạ độ GPS của khách hàng, tự động tìm chợ gần nhất (hoặc theo marketId tùy chọn) và tính toán khoảng cách thực tế, thời gian di chuyển, toạ độ vẽ đường đi (GeoJSON LineString) và các chỉ dẫn rẽ.")
    @GetMapping("/api/markets/nearest-and-route")
    public Mono<ResponseEntity<ApiResponse<RouteResponse>>> getNearestMarketRoute(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Long marketId) {
        return routingService.findNearestMarketAndRoute(latitude, longitude, marketId)
                .map(route -> ResponseEntity.ok(ApiResponse.success("Tìm lộ trình tới chợ thành công qua OpenStreetMap.", route)));
    }

    @Operation(summary = "Kiểm tra định vị Geofencing vùng chợ (300m) & phát chuông báo",
               description = "Dành cho khách hàng đã đăng nhập. Khi toạ độ GPS của khách bước vào bán kính 300m quanh chợ, hệ thống gửi thông báo cho khách và chuông báo soạn hàng cho các sạp nông dân.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/api/customer/geofence/check-in")
    public Mono<ResponseEntity<ApiResponse<GeofenceCheckResponse>>> checkGeofenceCustomer(
            Authentication authentication,
            @Valid @RequestBody GeofenceCheckRequest request) {
        String email = authentication != null ? authentication.getName() : "customer@marketlink.vn";
        return routingService.checkGeofence(email, request.getLatitude(), request.getLongitude(), request.getTargetMarketId())
                .map(res -> ResponseEntity.ok(ApiResponse.success("Kiểm tra Geofencing thành công.", res)));
    }

    @Operation(summary = "Thử nghiệm giả lập Geofencing công khai (Demo)",
               description = "Cho phép giả lập toạ độ di chuyển để kiểm tra tính năng chuông báo và bán kính 300m mà không bắt buộc đăng nhập.")
    @PostMapping("/api/markets/geofence/simulate")
    public Mono<ResponseEntity<ApiResponse<GeofenceCheckResponse>>> simulateGeofence(
            @Valid @RequestBody GeofenceCheckRequest request) {
        return routingService.checkGeofence("customer@marketlink.vn", request.getLatitude(), request.getLongitude(), request.getTargetMarketId())
                .map(res -> ResponseEntity.ok(ApiResponse.success("Mô phỏng Geofencing thành công.", res)));
    }
}
