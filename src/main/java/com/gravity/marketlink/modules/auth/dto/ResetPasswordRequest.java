package com.gravity.marketlink.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Password reset request using OTP")
public class ResetPasswordRequest {

    @NotBlank(message = "Email or phone cannot be blank")
    @Schema(description = "Account email or phone number", example = "farmer1@marketlink.com")
    private String emailOrPhone;

    @NotBlank(message = "Verification code cannot be blank")
    @Schema(description = "Received OTP verification code", example = "123456")
    private String code;

    @NotBlank(message = "New password cannot be blank")
    @Size(min = 6, message = "New password must be at least 6 characters")
    @Schema(description = "New password", example = "NewPass@123456")
    private String newPassword;
}
