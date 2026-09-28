package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detailed market information and session schedules")
public class MarketDetailResponse {

    @Schema(description = "Market identifier ID", example = "1")
    private Long marketId;

    @Schema(description = "Farmers market name", example = "Ba Dinh Farmers Market")
    private String name;

    @Schema(description = "Street address", example = "Quan Ngua Sports Complex, Van Cao, Ba Dinh, Hanoi")
    private String address;

    @Schema(description = "Latitude coordinate for map pin", example = "21.038234")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate for map pin", example = "105.817456")
    private BigDecimal longitude;

    @Schema(description = "Market description", example = "Organic farmers market featuring over 30 verified local growers.")
    private String description;

    @Schema(description = "Market thumbnail image URL", example = "https://images.unsplash.com/photo-1488459716781-31db52582fe9")
    private String imageUrl;

    @Schema(description = "Operating status (ACTIVE / INACTIVE)", example = "ACTIVE")
    private String status;

    @Schema(description = "Recurring weekly market session schedule")
    private List<MarketScheduleDto> schedules;

    @Schema(description = "Number of participating farmer stalls", example = "15")
    private Long activeFarmersCount;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
}
