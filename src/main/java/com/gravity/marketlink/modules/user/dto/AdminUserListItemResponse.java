package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User summary information in admin management list")
public class AdminUserListItemResponse {

    @Schema(description = "User ID", example = "2")
    private Long userId;

    @Schema(description = "Email", example = "customer1@marketlink.com")
    private String email;

    @Schema(description = "Full name", example = "Alice Smith")
    private String fullName;

    @Schema(description = "Phone number", example = "0987654321")
    private String phoneNumber;

    @Schema(description = "Avatar image URL", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Account status: ACTIVE, SUSPENDED, PENDING", example = "ACTIVE")
    private String status;

    @Schema(description = "KYC status: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "VERIFIED")
    private String kycStatus;

    @Schema(description = "Role list", example = "[\"ROLE_CUSTOMER\"]")
    private List<String> roles;

    @Schema(description = "Email verified status", example = "true")
    private Boolean isEmailVerified;

    @Schema(description = "Phone verified status", example = "true")
    private Boolean isPhoneVerified;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;
}
