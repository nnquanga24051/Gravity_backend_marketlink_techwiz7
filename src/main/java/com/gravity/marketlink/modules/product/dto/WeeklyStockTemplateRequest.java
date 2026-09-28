package com.gravity.marketlink.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyStockTemplateRequest {

    @NotNull(message = "Product ID cannot be null")
    private Long productId;

    @NotNull(message = "Market ID cannot be null")
    private Long marketId;

    @NotNull(message = "Day of week cannot be null")
    @Min(value = 1, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    @Max(value = 7, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    private Integer dayOfWeek;

    @NotNull(message = "Target quota quantity cannot be null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Target quota quantity must be greater than 0")
    private BigDecimal recurringQuantity;

    @Builder.Default
    private Boolean isActive = true;
}
