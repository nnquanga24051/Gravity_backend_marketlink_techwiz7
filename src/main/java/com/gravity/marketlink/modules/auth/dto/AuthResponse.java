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

    @Schema(description = "Access Token chính dùng trong Header: Authorization: Bearer <token>")
    private String token; // Giữ để tương thích ngược với code cũ

    @Schema(description = "Access Token (30 phút)")
    private String accessToken;

    @Schema(description = "Refresh Token (7 ngày) dùng để cấp mới Access Token qua /api/auth/refresh")
    private String refreshToken;

    @Builder.Default
    private String type = "Bearer";

    @Schema(description = "Thời gian hết hạn của Access Token tính bằng mili giây (VD: 1800000 = 30 phút)")
    private Long expiresIn;

    private Long userId;
    private String fullName;
    private String email;
    private List<String> roles;
}
