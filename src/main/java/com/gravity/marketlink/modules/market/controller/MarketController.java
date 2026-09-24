package com.gravity.marketlink.modules.market.controller;

import com.gravity.marketlink.modules.market.dto.FarmerAtMarketResponse;
import com.gravity.marketlink.modules.market.dto.FarmerRegisterMarketRequest;
import com.gravity.marketlink.modules.market.dto.MarketDetailResponse;
import com.gravity.marketlink.modules.market.dto.MarketRequest;
import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.service.MarketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@Tag(name = "5. Chợ nông sản & Bản đồ (Markets & Schedules)", description = "Các API khám phá điểm chợ, ghim vị trí bản đồ (Map Pin), lịch họp chợ và danh sách nông dân tại sạp")
@RestController
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    // ===================================================================
    // PUBLIC APIS (Dành cho Khách hàng & Ứng dụng bản đồ)
    // ===================================================================

    @Operation(summary = "Lấy danh sách chợ nông sản (Map Pin)", description = "Trả về danh sách tất cả các điểm chợ đang hoạt động kèm tọa độ GPS (Latitude, Longitude) để hiển thị lên Google Maps / Bản đồ.")
    @GetMapping("/api/markets")
    public Flux<Market> getAllMarkets() {
        return marketService.getAllActiveMarkets();
    }

    @Operation(summary = "Lấy chi tiết chợ & Lịch họp chợ", description = "Trả về thông tin chi tiết của một chợ cụ thể kèm danh sách lịch họp chợ định kỳ trong tuần và số lượng sạp nông dân.")
    @GetMapping("/api/markets/{id}")
    public Mono<ResponseEntity<MarketDetailResponse>> getMarketDetail(@PathVariable("id") Long id) {
        return marketService.getMarketDetail(id)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Xem danh sách sạp nông dân tại chợ", description = "Trả về danh sách các nông dân và số sạp tương ứng đang hoạt động tại chợ.")
    @GetMapping("/api/markets/{id}/farmers")
    public Flux<FarmerAtMarketResponse> getFarmersAtMarket(@PathVariable("id") Long id) {
        return marketService.getFarmersAtMarket(id);
    }

    @Operation(summary = "Lọc chợ theo ngày họp trong tuần", description = "Lọc các chợ có phiên họp vào ngày chỉ định: 1 = Thứ 2, ..., 6 = Thứ 7, 7 = Chủ nhật.")
    @GetMapping("/api/markets/filter-by-day")
    public Flux<Market> getMarketsByDayOfWeek(@RequestParam("dayOfWeek") Integer dayOfWeek) {
        return marketService.getMarketsByDayOfWeek(dayOfWeek);
    }

    // ===================================================================
    // FARMER APIS (Dành cho Nông dân quản lý sạp)
    // ===================================================================

    @Operation(summary = "Nông dân đăng ký tham gia chợ", description = "Chỉ cho phép tài khoản có ROLE_FARMER đăng ký sạp tại chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('FARMER')")
    @PostMapping("/api/farmer/markets/register")
    public Mono<ResponseEntity<FarmerMarketAssignment>> registerMarket(
            Authentication authentication,
            @Valid @RequestBody FarmerRegisterMarketRequest request) {
        return marketService.farmerRegisterMarket(authentication.getName(), request)
                .map(assignment -> ResponseEntity.status(HttpStatus.CREATED).body(assignment));
    }

    @Operation(summary = "Xem danh sách chợ nông dân đã đăng ký", description = "Trả về các phiên chợ mà nông dân hiện tại đã tham gia.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('FARMER')")
    @GetMapping("/api/farmer/markets/my-assignments")
    public Flux<FarmerMarketAssignment> getMyMarketAssignments(Authentication authentication) {
        return marketService.getMyMarketAssignments(authentication.getName());
    }

    // ===================================================================
    // ADMIN APIS (Dành cho Quản trị viên hệ thống)
    // ===================================================================

    @Operation(summary = "Admin tạo mới chợ nông sản", description = "Thêm điểm chợ mới cùng danh sách lịch họp định kỳ (Yêu cầu quyền ROLE_ADMIN).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/markets")
    public Mono<ResponseEntity<MarketDetailResponse>> createMarket(@Valid @RequestBody MarketRequest request) {
        return marketService.createMarket(request)
                .map(market -> ResponseEntity.status(HttpStatus.CREATED).body(market));
    }

    @Operation(summary = "Admin cập nhật thông tin chợ & lịch họp", description = "Cập nhật tên, địa chỉ, tọa độ bản đồ, mô tả và cập nhật lại lịch họp chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/markets/{id}")
    public Mono<ResponseEntity<MarketDetailResponse>> updateMarket(
            @PathVariable("id") Long id,
            @Valid @RequestBody MarketRequest request) {
        return marketService.updateMarket(id, request)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Admin tạm ngưng hoạt động chợ", description = "Chuyển trạng thái chợ sang INACTIVE.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/{id}")
    public Mono<ResponseEntity<Map<String, Object>>> deleteMarket(@PathVariable("id") Long id) {
        return marketService.deleteMarket(id)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Admin phê duyệt hoặc thu hồi sạp chợ", description = "Cập nhật trạng thái sạp của nông dân (ACTIVE, REVOKED, REGISTERED).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/markets/assignments/{assignmentId}/status")
    public Mono<ResponseEntity<Map<String, Object>>> updateAssignmentStatus(
            @PathVariable("assignmentId") Long assignmentId,
            @RequestParam("status") String status) {
        return marketService.updateAssignmentStatus(assignmentId, status)
                .map(ResponseEntity::ok);
    }
}
