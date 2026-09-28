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
@Tag(name = "Auth - Verification & Password Reset", description = "APIs for sending email/phone OTP verification and password resetting")
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/verification/send-otp")
    @Operation(summary = "Send OTP verification code", description = "Generates and sends 6-digit OTP code via email/SMS for account verification or password reset")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> sendOtp(
            @Valid @RequestBody SendOtpRequest request) {
        return verificationService.sendOtp(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success("OTP code has been sent.", response)));
    }

    @PostMapping("/verification/verify-otp")
    @Operation(summary = "Verify OTP code", description = "Validates entered OTP code, maximum 5 attempts before invalidation")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        return verificationService.verifyOtp(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response.getMessage(), response)));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Customer or Farmer resets new password using received OTP code")
    public Mono<ResponseEntity<ApiResponse<OtpResponse>>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        return verificationService.resetPassword(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success(response.getMessage(), response)));
    }
}
