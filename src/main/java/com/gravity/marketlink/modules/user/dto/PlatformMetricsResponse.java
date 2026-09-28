package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformMetricsResponse {

    @Schema(description = "Total registered farmers on platform", example = "45")
    private Long totalFarmers;

    @Schema(description = "Total registered customers on platform", example = "320")
    private Long totalCustomers;

    @Schema(description = "Total local farmers market locations", example = "12")
    private Long totalMarkets;

    @Schema(description = "Total pre-orders placed", example = "1540")
    private Long totalOrders;

    @Schema(description = "Total platform revenue from completed orders", example = "125000000")
    private BigDecimal totalRevenue;

    @Schema(description = "Number of farmer KYC applications pending review", example = "5")
    private Long pendingKycCount;
}
