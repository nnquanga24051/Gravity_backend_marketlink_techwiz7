package com.gravity.marketlink.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @Schema(description = "Primary Access Token used in Header: Authorization: Bearer <token>")
    private String token; // Retained for backward compatibility with legacy clients

    @Schema(description = "Access Token (30 minutes)")
    private String accessToken;

    @Schema(description = "Refresh Token (7 days) used to issue new Access Token via /api/auth/refresh")
    private String refreshToken;

    @Builder.Default
    private String type = "Bearer";

    @Schema(description = "Access Token expiration time in milliseconds (e.g. 1800000 = 30 mins)")
    private Long expiresIn;

    private Long userId;
    private String fullName;
    private String email;
    private List<String> roles;
}
