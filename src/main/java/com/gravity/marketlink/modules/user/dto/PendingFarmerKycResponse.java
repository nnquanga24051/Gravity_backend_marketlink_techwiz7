package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Summary of pending farmer KYC application")
public class PendingFarmerKycResponse {

    @Schema(description = "Farmer ID", example = "2")
    private Long farmerId;

    @Schema(description = "Farmer full name", example = "Nguyen Van A")
    private String fullName;

    @Schema(description = "Email", example = "farmer1@marketlink.com")
    private String email;

    @Schema(description = "Phone number", example = "0901234567")
    private String phoneNumber;

    @Schema(description = "Stall name / Farm name", example = "Ba Vi Green Farm")
    private String stallName;

    @Schema(description = "Farm address", example = "Hamlet 2, Van Hoa, Ba Vi, Hanoi")
    private String farmAddress;

    @Schema(description = "KYC status", example = "PENDING")
    private String kycStatus;

    @Schema(description = "Number of submitted documents", example = "3")
    private Integer documentCount;

    @Schema(description = "Latest submission date")
    private LocalDateTime lastSubmittedAt;
}
