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
@Schema(description = "Nearest market routing and navigation results")
public class RouteResponse {

    @Schema(description = "Market ID", example = "101")
    private Long marketId;

    @Schema(description = "Farmers market name", example = "Ba Dinh Green Farmers Market")
    private String marketName;

    @Schema(description = "Market address", example = "12 Nui Truc, Giang Vo, Ba Dinh, Hanoi")
    private String marketAddress;

    @Schema(description = "Market latitude", example = "21.0312")
    private Double marketLatitude;

    @Schema(description = "Market longitude", example = "105.8189")
    private Double marketLongitude;

    @Schema(description = "Customer latitude", example = "21.0185")
    private Double originLatitude;

    @Schema(description = "Customer longitude", example = "105.8290")
    private Double originLongitude;

    @Schema(description = "Actual travel distance via road network (km)", example = "2.8")
    private Double distanceKilometers;

    @Schema(description = "Estimated travel duration (minutes)", example = "8")
    private Integer estimatedMinutes;

    @Schema(description = "Array of [[lat, lon], ...] coordinates for OpenStreetMap Leaflet rendering")
    private List<List<Double>> routeGeometry;

    @Schema(description = "Turn-by-turn navigation instruction list")
    private List<String> navigationSteps;

    @Schema(description = "Direct launch link for Google Maps Navigation")
    private String googleMapsNavUrl;

    @Schema(description = "Whether customer is within 300m Geofencing radius around market", example = "false")
    private Boolean inGeofence;
}
