package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Admin request to create new user account")
public class AdminCreateUserRequest {

    @NotBlank(message = "Full name cannot be blank")
    @Schema(description = "User full name", example = "David Miller")
    private String fullName;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    @Schema(description = "Login email", example = "farmer.tran@marketlink.vn")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "Login password", example = "MarketLink@123")
    private String password;

    @Schema(description = "Contact phone number", example = "0987654321")
    private String phoneNumber;

    @NotBlank(message = "Role cannot be blank")
    @Schema(description = "User role (CUSTOMER, FARMER, ADMIN)", example = "FARMER")
    private String role;

    @Schema(description = "Account status (ACTIVE, SUSPENDED)", example = "ACTIVE")
    private String status;

    @Schema(description = "Contact / delivery address", example = "123 Market Street, Hanoi")
    private String address;

    // Specific fields for creating Farmer account (FARMER)
    @Schema(description = "Farm / Stall name", example = "Ba Vi Green Organic Cooperative")
    private String farmName;

    @Schema(description = "Farm / production facility address", example = "Van Hoa, Ba Vi, Hanoi")
    private String farmAddress;

    @Schema(description = "Initial KYC status (UNVERIFIED, PENDING, VERIFIED)", example = "VERIFIED")
    private String kycStatus;
}
