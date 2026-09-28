package com.gravity.marketlink.modules.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRequest {

    @NotNull(message = "Pickup date cannot be null")
    @Schema(description = "New scheduled pickup date at market", example = "2026-10-05")
    private LocalDate pickupDate;

    @NotNull(message = "Pickup slot cannot be null")
    @Schema(description = "New pickup slot ID", example = "2")
    private Long slotId;

    @Schema(description = "Additional notes for re-order", example = "Same items as previous order, please pack carefully")
    private String note;
}
