package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Create or update farmers market request (For Administrators)")
public class MarketRequest {

    @NotBlank(message = "Market name cannot be blank")
    @Schema(description = "Farmers market name", example = "Ba Dinh Farmers Market")
    private String name;

    @NotBlank(message = "Street address cannot be blank")
    @Schema(description = "Market address", example = "Quan Ngua Sports Complex, Van Cao, Ba Dinh, Hanoi")
    private String address;

    @NotNull(message = "Latitude cannot be null")
    @Schema(description = "Latitude coordinate", example = "21.038234")
    private BigDecimal latitude;

    @NotNull(message = "Longitude cannot be null")
    @Schema(description = "Longitude coordinate", example = "105.817456")
    private BigDecimal longitude;

    @Schema(description = "Market description", example = "Open every Saturday and Sunday, specializing in regional highland produce.")
    private String description;

    @Schema(description = "Market thumbnail image URL", example = "https://images.unsplash.com/photo-1488459716781-31db52582fe9")
    private String imageUrl;

    @Schema(description = "Status (ACTIVE / INACTIVE)", example = "ACTIVE")
    private String status;

    @Schema(description = "Recurring market schedule list")
    private List<MarketScheduleDto> schedules;
}
