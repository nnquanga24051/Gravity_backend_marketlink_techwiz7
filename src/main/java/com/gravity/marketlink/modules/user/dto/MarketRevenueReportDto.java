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
public class MarketRevenueReportDto {

    @Schema(description = "Market ID", example = "1")
    private Long marketId;

    @Schema(description = "Farmers market name", example = "Ba Vi Farmers Market")
    private String marketName;

    @Schema(description = "Market address", example = "Tay Dang Town, Ba Vi District, Hanoi")
    private String address;

    @Schema(description = "Total orders generated at market location", example = "180")
    private Long totalOrders;

    @Schema(description = "Cumulative revenue generated at market", example = "24500000")
    private BigDecimal totalRevenue;

    @Schema(description = "Number of active farmers at market", example = "8")
    private Long activeFarmersCount;
}
