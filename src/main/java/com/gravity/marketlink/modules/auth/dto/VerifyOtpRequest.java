package com.gravity.marketlink.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to verify OTP code")
public class VerifyOtpRequest {

    @NotBlank(message = "Email or phone cannot be blank")
    @Schema(description = "Email or phone number that received code", example = "farmer1@marketlink.com")
    private String emailOrPhone;

    @NotBlank(message = "Verification type cannot be blank")
    @Schema(description = "Verification type: EMAIL_CONFIRMATION, PHONE_OTP, PASSWORD_RESET", example = "EMAIL_CONFIRMATION")
    private String type;

    @NotBlank(message = "Verification code cannot be blank")
    @Schema(description = "6-character OTP code", example = "123456")
    private String code;
}
