package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Admin request to assign or update stall for farmer")
public class AdminAssignStallRequest {

    @NotNull(message = "Farmer ID cannot be null")
    @Schema(description = "User ID of farmer", example = "5")
    private Long farmerId;

    @NotNull(message = "Market ID cannot be null")
    @Schema(description = "Market ID of farmers market", example = "1")
    private Long marketId;

    @NotBlank(message = "Stall number cannot be blank")
    @Schema(description = "Stall code / booth position at market", example = "Stall A-08")
    private String stallNumber;

    @Schema(description = "Approval status (ACTIVE, REGISTERED, REVOKED). Default: ACTIVE", example = "ACTIVE")
    private String status;
}
