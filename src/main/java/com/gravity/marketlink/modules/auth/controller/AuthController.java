package com.gravity.marketlink.modules.auth.controller;

import com.gravity.marketlink.modules.auth.dto.AuthResponse;
import com.gravity.marketlink.modules.auth.dto.LoginRequest;
import com.gravity.marketlink.modules.auth.dto.RegisterRequest;
import com.gravity.marketlink.modules.auth.dto.UserProfileResponse;
import com.gravity.marketlink.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "1. Xác thực & Người dùng (Auth)", description = "Các API đăng nhập, đăng ký tài khoản và truy xuất thông tin cá nhân")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Đăng ký tài khoản mới", description = "Đăng ký tài khoản cho FARMER hoặc CUSTOMER")
    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@jakarta.validation.Valid @RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @Operation(summary = "Đăng nhập", description = "Đăng nhập bằng Email & Password để nhận JWT Token sử dụng cho các API bảo mật")
    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@jakarta.validation.Valid @RequestBody LoginRequest request) {
        return authService.login(request)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Làm mới Access Token (Refresh Token)", description = "Sử dụng Refresh Token dài hạn để cấp mới cặp Token mà không cần đăng nhập lại (áp dụng cơ chế xoay vòng Refresh Token Rotation - RTR).")
    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthResponse>> refreshToken(@jakarta.validation.Valid @RequestBody com.gravity.marketlink.modules.auth.dto.RefreshTokenRequest request) {
        return authService.refreshToken(request.getRefreshToken())
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Lấy thông tin tài khoản hiện tại (/me)", description = "Yêu cầu Bearer Token để lấy profile người dùng đang đăng nhập")
    @GetMapping("/me")
    public Mono<ResponseEntity<UserProfileResponse>> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return authService.getCurrentUserProfile(authentication.getName())
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Đăng xuất tài khoản", description = "Vô hiệu hóa token JWT hiện tại, thu hồi quyền truy cập và xóa phiên làm việc.")
    @PostMapping("/logout")
    public Mono<ResponseEntity<java.util.Map<String, Object>>> logout(
            @org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String bearerToken) {
        return authService.logout(bearerToken)
                .thenReturn(ResponseEntity.ok(java.util.Map.<String, Object>of(
                        "status", "SUCCESS",
                        "message", "Đăng xuất thành công! Token JWT đã được vô hiệu hóa."
                )));
    }
}
