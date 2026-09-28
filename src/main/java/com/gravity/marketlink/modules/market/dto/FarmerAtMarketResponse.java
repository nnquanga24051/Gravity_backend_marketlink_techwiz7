package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Details of farmer stall operating at market")
public class FarmerAtMarketResponse {

    @Schema(description = "Stall assignment ID", example = "1")
    private Long assignmentId;

    @Schema(description = "Farmer identifier ID", example = "2")
    private Long farmerId;

    @Schema(description = "Market ID", example = "1")
    private Long marketId;

    @Schema(description = "Stall booth number at market", example = "Stall A-12")
    private String stallNumber;

    @Schema(description = "Stall status (ACTIVE, REGISTERED, REVOKED)", example = "ACTIVE")
    private String status;

    @Schema(description = "Stall name / Produce booth", example = "Ba Dinh Organic Veggie Stall")
    private String stallName;

    @Schema(description = "Full name of farm owner", example = "John Doe")
    private String farmerName;

    @Schema(description = "Farm biography / introduction", example = "Specializing in VietGAP organic vegetables without pesticides")
    private String bio;

    @Schema(description = "Farm address", example = "Hamlet 2, Yen Bai, Ba Vi, Hanoi")
    private String farmAddress;

    @Schema(description = "Farm latitude coordinate", example = "21.050000")
    private BigDecimal latitude;

    @Schema(description = "Farm longitude coordinate", example = "105.780000")
    private BigDecimal longitude;

    @Schema(description = "Avatar image URL", example = "https://images.unsplash.com/photo-1544005313-94ddf0286df2")
    private String avatarUrl;

    @Schema(description = "Contact phone number", example = "0912345678")
    private String phoneNumber;
}
