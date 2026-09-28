package com.gravity.marketlink.modules.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupSlotRequest {

    @NotNull(message = "Market ID (marketId) cannot be null")
    private Long marketId;

    @NotNull(message = "Pickup slot start time cannot be null")
    @Schema(example = "07:00:00", description = "Format: HH:mm:ss")
    private LocalTime startTime;

    @NotNull(message = "Pickup slot end time cannot be null")
    @Schema(example = "08:00:00", description = "Format: HH:mm:ss")
    private LocalTime endTime;

    @Builder.Default
    private Integer maxOrdersCapacity = 10;
}
