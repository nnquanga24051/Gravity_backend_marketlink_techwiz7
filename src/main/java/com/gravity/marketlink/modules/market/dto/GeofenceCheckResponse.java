package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Geofence perimeter check result around market")
public class GeofenceCheckResponse {

    @Schema(description = "Whether user is currently within 300m radius of market", example = "true")
    private Boolean inGeofence;

    @Schema(description = "Current distance to market entrance (meters)", example = "145.5")
    private Double distanceMeters;

    @Schema(description = "Nearest detected market ID", example = "101")
    private Long marketId;

    @Schema(description = "Farmers market name", example = "Ba Dinh Green Farmers Market")
    private String marketName;

    @Schema(description = "Welcome notification message", example = "Welcome to Ba Dinh Green Farmers Market! Your pre-order is ready for pickup at the stall.")
    private String alertMessage;

    @Schema(description = "Number of notifications sent to farmer stalls with pending orders", example = "2")
    private Integer notifiedFarmersCount;

    @Schema(description = "Customer order ID list for today's market session")
    private List<String> todayOrderCodes;
}
