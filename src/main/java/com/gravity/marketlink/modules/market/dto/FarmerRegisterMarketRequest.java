package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Market stall participation request (For Farmers)")
public class FarmerRegisterMarketRequest {

    @NotNull(message = "Market ID cannot be null")
    @Schema(description = "Market ID to register for", example = "1")
    private Long marketId;

    @Schema(description = "Desired stall number (optional)", example = "Stall A-05")
    private String stallNumber;
}
