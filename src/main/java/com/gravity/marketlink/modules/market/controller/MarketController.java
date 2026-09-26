package com.gravity.marketlink.modules.market.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.market.dto.AdminAssignStallRequest;
import com.gravity.marketlink.modules.market.dto.FarmerAtMarketResponse;
import com.gravity.marketlink.modules.market.dto.FarmerRegisterMarketRequest;
import com.gravity.marketlink.modules.market.dto.MarketDetailResponse;
import com.gravity.marketlink.modules.market.dto.MarketRequest;
import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.service.MarketService;
import java.util.List;
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

    @Operation(summary = "Lấy danh sách chợ nông sản (Map Pin)", description = "Trả về danh sách tất cả các điểm chợ đang hoạt động kèm tọa độ GPS (Latitude, Longitude), hỗ trợ tìm kiếm theo tên, địa chỉ, thành phố và ngày họp.")
    @GetMapping("/api/markets")
    public Flux<Market> getAllMarkets(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "dayOfWeek", required = false) Integer dayOfWeek) {
        return marketService.getAllActiveMarkets(search, city, dayOfWeek);
    }

    @Operation(summary = "Xem & Tìm kiếm sạp nông dân trên toàn sàn hoặc theo chợ", description = "Tìm kiếm nhanh các sạp nông dân theo từ khóa (tên sạp, tên chủ nông trại, địa chỉ trang trại) hoặc mã chợ.")
    @GetMapping("/api/markets/stalls")
    public Flux<FarmerAtMarketResponse> getStalls(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "marketId", required = false) Long marketId) {
        return marketService.getAllStalls(search, marketId);
    }

    @Operation(summary = "Lấy chi tiết chợ & Lịch họp chợ", description = "Trả về thông tin chi tiết của một chợ cụ thể kèm danh sách lịch họp chợ định kỳ trong tuần và số lượng sạp nông dân.")
    @GetMapping("/api/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<MarketDetailResponse>> getMarketDetail(@PathVariable("id") Long id) {
        return marketService.getMarketDetail(id)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Xem danh sách sạp nông dân tại chợ", description = "Trả về danh sách các nông dân và số sạp tương ứng đang hoạt động tại chợ.")
    @GetMapping("/api/markets/{id:[0-9]+}/farmers")
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
    @PostMapping("/api/farmer/markets/register")
    public Mono<ResponseEntity<FarmerMarketAssignment>> registerMarket(
            Authentication authentication,
            @Valid @RequestBody FarmerRegisterMarketRequest request) {
        return marketService.farmerRegisterMarket(authentication.getName(), request)
                .map(assignment -> ResponseEntity.status(HttpStatus.CREATED).body(assignment));
    }

    @Operation(summary = "Xem danh sách chợ nông dân đã đăng ký", description = "Trả về các phiên chợ mà nông dân hiện tại đã tham gia.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/api/farmer/markets/my-assignments")
    public Flux<FarmerMarketAssignment> getMyMarketAssignments(Authentication authentication) {
        return marketService.getMyMarketAssignments(authentication.getName());
    }

    // ===================================================================
    // ADMIN APIS (Dành cho Quản trị viên hệ thống - Full CRUD Chợ & Sạp)
    // ===================================================================

    @Operation(summary = "Admin lấy danh sách tất cả chợ nông sản", description = "Lấy toàn bộ danh sách chợ nông sản với bộ lọc trạng thái (ALL, ACTIVE, INACTIVE) và tìm kiếm theo tên hoặc địa chỉ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets")
    public Mono<ResponseEntity<ApiResponse<List<MarketDetailResponse>>>> getAllMarketsForAdmin(
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(value = "search", required = false) String search) {
        return marketService.getAllMarketsForAdmin(status, search)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách chợ thành công.", list)));
    }

    @Operation(summary = "Admin xem chi tiết một chợ nông sản", description = "Lấy thông tin chi tiết chợ, lịch họp chợ và số lượng nông dân đang tham gia (kể cả chợ INACTIVE).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> getMarketDetailForAdmin(@PathVariable("id") Long id) {
        return marketService.getMarketDetail(id)
                .map(detail -> ResponseEntity.ok(ApiResponse.success("Lấy chi tiết chợ nông sản thành công.", detail)));
    }

    @Operation(summary = "Admin tạo mới chợ nông sản", description = "Thêm điểm chợ mới cùng danh sách lịch họp định kỳ trong tuần.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/markets")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> createMarket(@Valid @RequestBody MarketRequest request) {
        return marketService.createMarket(request)
                .map(market -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Tạo mới chợ nông sản thành công.", market)));
    }

    @Operation(summary = "Admin cập nhật thông tin chợ & lịch họp", description = "Cập nhật tên, địa chỉ, tọa độ bản đồ, mô tả, ảnh đại diện và cơ cấu lại lịch họp chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> updateMarket(
            @PathVariable("id") Long id,
            @Valid @RequestBody MarketRequest request) {
        return marketService.updateMarket(id, request)
                .map(market -> ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin chợ nông sản thành công.", market)));
    }

    @Operation(summary = "Admin thay đổi trạng thái hoạt động chợ", description = "Kích hoạt (ACTIVE) hoặc tạm dừng (INACTIVE) chợ nhanh chóng.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/markets/{id:[0-9]+}/status")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> updateMarketStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        return marketService.updateMarketStatus(id, status)
                .map(market -> ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái chợ thành công (" + status + ").", market)));
    }

    @Operation(summary = "Admin tạm ngưng hoạt động chợ (Xóa mềm)", description = "Chuyển trạng thái chợ sang INACTIVE để ẩn khỏi khách hàng mà vẫn lưu toàn vẹn dữ liệu.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteMarket(@PathVariable("id") Long id) {
        return marketService.deleteMarket(id)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Đã tạm dừng chợ thành công.", result)));
    }

    @Operation(summary = "Admin xóa vĩnh viễn chợ nông sản", description = "Xóa vĩnh viễn chợ cùng lịch họp nếu chưa có đơn hàng liên kết (Bảo toàn dữ liệu).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/{id:[0-9]+}/permanent")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteMarketPermanently(@PathVariable("id") Long id) {
        return marketService.deleteMarketPermanently(id)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Đã xóa vĩnh viễn chợ thành công.", result)));
    }

    @Operation(summary = "Admin phân sạp chợ cho nông dân", description = "Chỉ định trực tiếp nông dân vào gian hàng/sạp cụ thể tại chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/markets/assignments")
    public Mono<ResponseEntity<ApiResponse<FarmerMarketAssignment>>> adminAssignStall(
            @Valid @RequestBody AdminAssignStallRequest request) {
        return marketService.adminAssignStall(request)
                .map(assignment -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Phân sạp cho nông dân thành công.", assignment)));
    }

    @Operation(summary = "Admin xem danh sách sạp tại chợ", description = "Xem tất cả nông dân và sạp đã đăng ký/được phân bổ tại chợ (mọi trạng thái).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets/{id:[0-9]+}/assignments")
    public Mono<ResponseEntity<ApiResponse<List<FarmerAtMarketResponse>>>> getMarketAssignmentsForAdmin(
            @PathVariable("id") Long id) {
        return marketService.getMarketAssignmentsForAdmin(id)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách sạp chợ thành công.", list)));
    }

    @Operation(summary = "Admin duyệt hoặc thu hồi sạp chợ", description = "Cập nhật trạng thái sạp của nông dân (ACTIVE, REVOKED, REGISTERED).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/markets/assignments/{assignmentId:[0-9]+}/status")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> updateAssignmentStatus(
            @PathVariable("assignmentId") Long assignmentId,
            @RequestParam("status") String status) {
        return marketService.updateAssignmentStatus(assignmentId, status)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái sạp thành công.", result)));
    }

    @Operation(summary = "Admin xóa phân bổ sạp", description = "Xóa phân bổ sạp của nông dân khỏi chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/assignments/{assignmentId:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteAssignment(
            @PathVariable("assignmentId") Long assignmentId) {
        return marketService.deleteAssignment(assignmentId)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Xóa phân sạp thành công.", result)));
    }
}
