package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin tóm tắt người dùng trong danh sách quản trị")
public class AdminUserListItemResponse {

    @Schema(description = "ID người dùng", example = "2")
    private Long userId;

    @Schema(description = "Email", example = "customer1@marketlink.com")
    private String email;

    @Schema(description = "Họ và tên", example = "Trần Thị B")
    private String fullName;

    @Schema(description = "Số điện thoại", example = "0987654321")
    private String phoneNumber;

    @Schema(description = "Ảnh đại diện", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Trạng thái tài khoản: ACTIVE, SUSPENDED, PENDING", example = "ACTIVE")
    private String status;

    @Schema(description = "Trạng thái KYC: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "VERIFIED")
    private String kycStatus;

    @Schema(description = "Danh sách vai trò", example = "[\"ROLE_CUSTOMER\"]")
    private List<String> roles;

    @Schema(description = "Đã xác minh email", example = "true")
    private Boolean isEmailVerified;

    @Schema(description = "Đã xác minh số điện thoại", example = "true")
    private Boolean isPhoneVerified;

    @Schema(description = "Thời gian tạo tài khoản")
    private LocalDateTime createdAt;
}
