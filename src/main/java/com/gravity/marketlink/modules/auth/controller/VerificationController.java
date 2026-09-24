package com.gravity.marketlink.modules.auth.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.dto.OtpResponse;
import com.gravity.marketlink.modules.auth.dto.ResetPasswordRequest;
import com.gravity.marketlink.modules.auth.dto.SendOtpRequest;
import com.gravity.marketlink.modules.auth.dto.VerifyOtpRequest;
import com.gravity.marketlink.modules.auth.service.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth - Verification & Password Reset", description = "Các API gửi mã OTP xác minh Email/Phone và Đặt lại mật khẩu")
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verification/send-otp")
    @Operation(summary = "Gửi mã OTP", description = "Tạo và gửi mã OTP 6 số qua Email hoặc SMS để xác minh tài khoản hoặc đặt lại mật khẩu")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {
        return verificationService.sendOtp(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi.", response)));
    }

    @PostMapping("/verification/verify-otp")
    @Operation(summary = "Xác minh mã OTP", description = "Kiểm tra mã OTP nhập vào, tối đa 5 lần thử trước khi mã bị vô hiệu hóa")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return verificationService.verifyOtp(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response.getMessage(), response)));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Khách hàng hoặc Nông dân đặt lại mật khẩu mới bằng mã OTP đã nhận")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return verificationService.resetPassword(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response.getMessage(), response)));
    }
}
