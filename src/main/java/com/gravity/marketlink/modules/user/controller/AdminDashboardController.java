package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.user.dto.ActiveFarmerReportDto;
import com.gravity.marketlink.modules.user.dto.MarketRevenueReportDto;
import com.gravity.marketlink.modules.user.dto.PlatformMetricsResponse;
import com.gravity.marketlink.modules.user.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "6. Quản trị viên - Báo cáo & Thống kê sàn (Admin Dashboard & Analytics)", description = "Các API tổng hợp chỉ số toàn sàn, doanh thu theo chợ và xếp hạng nông dân tích cực nhất")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @Operation(summary = "Tổng quan chỉ số cốt lõi toàn sàn", description = "Thống kê tổng số Nông dân, Khách hàng, Chợ nông sản, Đơn hàng, Doanh thu hoàn thành và Hồ sơ KYC chờ duyệt.")
    @GetMapping("/metrics")
    public Mono<ResponseEntity<ApiResponse<PlatformMetricsResponse>>> getPlatformMetrics() {
        return dashboardService.getPlatformMetrics()
                .map(metrics -> ResponseEntity.ok(ApiResponse.success("Lấy chỉ số thống kê toàn sàn thành công.", metrics)));
    }

    @Operation(summary = "Báo cáo doanh thu & đơn hàng theo từng chợ", description = "Tổng hợp doanh thu, tổng số đơn đặt trước và số lượng nông dân hoạt động phân bổ theo từng điểm chợ.")
    @GetMapping("/reports/markets")
    public Mono<ResponseEntity<ApiResponse<List<MarketRevenueReportDto>>>> getMarketRevenueReports() {
        return dashboardService.getMarketRevenueReports()
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy báo cáo doanh thu theo chợ thành công.", list)));
    }

    @Operation(summary = "Xếp hạng nông dân tích cực nhất (Most Active Farmers)", description = "Danh sách top nông dân có số đơn hàng hoàn tất cao nhất và doanh thu tốt nhất trên sàn.")
    @GetMapping("/reports/most-active-farmers")
    public Mono<ResponseEntity<ApiResponse<List<ActiveFarmerReportDto>>>> getMostActiveFarmers(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return dashboardService.getMostActiveFarmers(limit)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy xếp hạng nông dân tích cực thành công.", list)));
    }
}
