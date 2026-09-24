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
@Schema(description = "Yêu cầu gửi mã OTP xác minh (Email/Phone/Reset password)")
public class SendOtpRequest {

    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    @Schema(description = "Email hoặc số điện thoại nhận mã", example = "farmer1@marketlink.com")
    private String emailOrPhone;

    @NotBlank(message = "Loại xác minh không được để trống")
    @Schema(description = "Loại xác minh: EMAIL_CONFIRMATION, PHONE_OTP, PASSWORD_RESET", example = "EMAIL_CONFIRMATION")
    private String type;
}
