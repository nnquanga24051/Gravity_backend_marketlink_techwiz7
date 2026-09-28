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

@Tag(name = "1. Authentication & Users (Auth)", description = "APIs for login, registration, and user profile retrieval")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new account", description = "Register an account for FARMER or CUSTOMER")
    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@jakarta.validation.Valid @RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @Operation(summary = "User login", description = "Login with Email & Password to receive JWT Token for secure API endpoints")
    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@jakarta.validation.Valid @RequestBody LoginRequest request) {
        return authService.login(request)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Refresh Access Token", description = "Use long-term Refresh Token to issue new tokens without re-login (Refresh Token Rotation - RTR).")
    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthResponse>> refreshToken(@jakarta.validation.Valid @RequestBody com.gravity.marketlink.modules.auth.dto.RefreshTokenRequest request) {
        return authService.refreshToken(request.getRefreshToken())
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Get current user profile (/me)", description = "Requires Bearer Token to retrieve profile of authenticated user")
    @GetMapping("/me")
    public Mono<ResponseEntity<UserProfileResponse>> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return authService.getCurrentUserProfile(authentication.getName())
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "User logout", description = "Revoke current JWT token, remove permissions, and terminate active session.")
    @PostMapping("/logout")
    public Mono<ResponseEntity<java.util.Map<String, Object>>> logout(
            @org.springframework.web.bind.annotation.RequestHeader(value = "Authorization", required = false) String bearerToken) {
        return authService.logout(bearerToken)
                .thenReturn(ResponseEntity.ok(java.util.Map.<String, Object>of(
                        "status", "SUCCESS",
                        "message", "Logged out successfully! JWT Token has been revoked."
                )));
    }
}
