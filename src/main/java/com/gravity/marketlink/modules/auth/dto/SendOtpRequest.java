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
@Schema(description = "Request to send OTP verification code (Email/Phone/Reset password)")
public class SendOtpRequest {

    @NotBlank(message = "Email or phone cannot be blank")
    @Schema(description = "Email or phone number to receive code", example = "farmer1@marketlink.com")
    private String emailOrPhone;

    @NotBlank(message = "Verification type cannot be blank")
    @Schema(description = "Verification type: EMAIL_CONFIRMATION, PHONE_OTP, PASSWORD_RESET", example = "EMAIL_CONFIRMATION")
    private String type;
}
