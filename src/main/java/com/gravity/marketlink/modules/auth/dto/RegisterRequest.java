package com.gravity.marketlink.modules.auth.dto;

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
public class RegisterRequest {

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    @Schema(description = "Login email", example = "farmer.bavi@marketlink.vn")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @Schema(description = "Account password (minimum 6 characters)", example = "Farmer@123")
    private String password;

    @NotBlank(message = "Full name cannot be blank")
    @Schema(description = "Account holder full name", example = "John Doe")
    private String fullName;

    @NotBlank(message = "Phone number cannot be blank")
    @Schema(description = "Contact phone number", example = "0987654321")
    private String phoneNumber;

    @NotBlank(message = "Role cannot be blank (FARMER or CUSTOMER)")
    @Schema(description = "Role: FARMER or CUSTOMER", example = "FARMER")
    private String role; // FARMER, CUSTOMER

    // Farmer specific fields
    @Schema(description = "Farm / Stall name (for FARMER only)", example = "Green Valley Farm")
    private String farmName;

    @Schema(description = "Farm / Cultivation address (for FARMER only)", example = "Green Valley, Highland District")
    private String farmAddress;

    // Customer specific fields
    @Schema(description = "Default delivery / pickup address (for CUSTOMER only)", example = "123 Market Street, Downtown")
    private String deliveryAddress;
}
