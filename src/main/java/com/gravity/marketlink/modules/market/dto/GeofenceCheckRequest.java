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
@Schema(description = "Geofencing coordinate check request")
public class GeofenceCheckRequest {

    @NotNull(message = "Latitude cannot be null")
    @Schema(description = "Current GPS latitude", example = "21.0315")
    private Double latitude;

    @NotNull(message = "Longitude cannot be null")
    @Schema(description = "Current GPS longitude", example = "105.8192")
    private Double longitude;

    @Schema(description = "Market ID to check (optional, automatically finds nearest market if omitted)", example = "101")
    private Long targetMarketId;
}
