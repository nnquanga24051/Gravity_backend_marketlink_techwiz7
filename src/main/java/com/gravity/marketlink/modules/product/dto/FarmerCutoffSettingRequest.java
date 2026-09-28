package com.gravity.marketlink.modules.product.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerCutoffSettingRequest {

    @NotNull(message = "Market ID (marketId) cannot be null")
    private Long marketId;

    @NotNull(message = "Day of week (dayOfWeek) cannot be null")
    @Min(value = 1, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    @Max(value = 7, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    private Integer dayOfWeek;

    @NotNull(message = "Cutoff hours before market opening cannot be null")
    @Min(value = 1, message = "Minimum cutoff is 1 hour before market")
    @Max(value = 72, message = "Maximum cutoff is 72 hours before market")
    private Integer cutoffHoursBefore;
}
