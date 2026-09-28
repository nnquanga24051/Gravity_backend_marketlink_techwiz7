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

@Tag(name = "6. Admin Dashboard & Platform Analytics", description = "APIs for platform-wide metrics aggregation, market revenue, and active farmer rankings")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @Operation(summary = "Platform core metrics overview", description = "Statistics of Farmers, Customers, Markets, Orders, Completed Revenue, and Pending KYC applications.")
    @GetMapping("/metrics")
    public Mono<ResponseEntity<ApiResponse<PlatformMetricsResponse>>> getPlatformMetrics() {
        return dashboardService.getPlatformMetrics()
                .map(metrics -> ResponseEntity.ok(ApiResponse.success("Retrieved platform statistics successfully.", metrics)));
    }

    @Operation(summary = "Revenue and orders report by market", description = "Aggregates revenue, pre-orders, and active farmers distribution by market location.")
    @GetMapping(value = {"/reports/markets", "/reports/revenue"})
    public Mono<ResponseEntity<ApiResponse<List<MarketRevenueReportDto>>>> getMarketRevenueReports() {
        return dashboardService.getMarketRevenueReports()
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved market revenue report successfully.", list)));
    }

    @Operation(summary = "Most Active Farmers Rankings", description = "Top farmers with highest completed orders and best platform sales performance.")
    @GetMapping(value = {"/reports/most-active-farmers", "/reports/active-farmers"})
    public Mono<ResponseEntity<ApiResponse<List<ActiveFarmerReportDto>>>> getMostActiveFarmers(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return dashboardService.getMostActiveFarmers(limit)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved active farmers ranking successfully.", list)));
    }
}
