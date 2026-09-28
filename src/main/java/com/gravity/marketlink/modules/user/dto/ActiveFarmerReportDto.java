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
public class ActiveFarmerReportDto {

    @Schema(description = "Farmer ID", example = "2")
    private Long farmerId;

    @Schema(description = "Stall name / Farm name", example = "Ba Vi Organic Farm")
    private String stallName;

    @Schema(description = "Farm owner full name", example = "David Miller")
    private String fullName;

    @Schema(description = "Contact phone number", example = "0987654321")
    private String phoneNumber;

    @Schema(description = "Total completed orders count", example = "65")
    private Long completedOrders;

    @Schema(description = "Total sales revenue", example = "18200000")
    private BigDecimal totalRevenue;
}
