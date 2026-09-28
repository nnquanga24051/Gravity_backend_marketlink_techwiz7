package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Personal profile update request payload")
public class UpdateProfileRequest {

    @Schema(description = "Full name", example = "John Doe")
    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    @Schema(description = "Contact phone number", example = "0987654321")
    @Size(max = 20, message = "Invalid phone number format")
    private String phoneNumber;

    @Schema(description = "Avatar image URL", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;

    // --- Customer specific details ---
    @Schema(description = "Default pickup/delivery address (For Customer)", example = "123 Lang Street, Dong Da, Hanoi")
    private String defaultAddress;

    @Schema(description = "Latitude coordinate", example = "21.028511")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate", example = "105.804817")
    private BigDecimal longitude;

    // --- Farmer specific details ---
    @Schema(description = "Stall / Farm name (For Farmer)", example = "Ba Dinh Organic Veggie Stall")
    private String stallName;

    @Schema(description = "Farm biography / grower intro (For Farmer)", example = "Certified VietGAP organic farm specializing in clean vegetables.")
    private String bio;

    @Schema(description = "Farm address (For Farmer)", example = "Hamlet 2, Yen Bai, Ba Vi, Hanoi")
    private String farmAddress;
}
