package com.gravity.marketlink.modules.user.dto;

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
@Schema(description = "Detailed user account information for Administrator")
public class AdminUserDetailResponse {

    @Schema(description = "User ID", example = "2")
    private Long userId;

    @Schema(description = "Email", example = "farmer1@marketlink.com")
    private String email;

    @Schema(description = "Full name", example = "John Farmer")
    private String fullName;

    @Schema(description = "Phone number", example = "0901234567")
    private String phoneNumber;

    @Schema(description = "Avatar image URL")
    private String avatarUrl;

    @Schema(description = "Account status: ACTIVE, SUSPENDED, PENDING", example = "ACTIVE")
    private String status;

    @Schema(description = "KYC status: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "VERIFIED")
    private String kycStatus;

    @Schema(description = "Role list", example = "[\"ROLE_FARMER\"]")
    private List<String> roles;

    @Schema(description = "Email verified status", example = "true")
    private Boolean isEmailVerified;

    @Schema(description = "Phone verified status", example = "true")
    private Boolean isPhoneVerified;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last updated timestamp")
    private LocalDateTime updatedAt;

    // Details if user is a Farmer
    @Schema(description = "Stall name / Farm name")
    private String stallName;

    @Schema(description = "Farm biography")
    private String bio;

    @Schema(description = "Farm address")
    private String farmAddress;

    @Schema(description = "Latitude coordinate")
    private BigDecimal latitude;

    @Schema(description = "Longitude coordinate")
    private BigDecimal longitude;

    @Schema(description = "Whether farmer has approved selling permission")
    private Boolean isApproved;

    // Details if user is a Customer
    @Schema(description = "Default delivery address")
    private String defaultAddress;

    @Schema(description = "Family head account ID if joined family group")
    private Long familyAccountId;

    @Schema(description = "Moderation audit history for this user")
    private List<VerificationAuditLogResponse> auditLogs;
}
