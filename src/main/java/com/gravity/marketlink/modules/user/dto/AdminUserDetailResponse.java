package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết tài khoản người dùng cho Quản trị viên")
public class AdminUserDetailResponse {

    @Schema(description = "ID người dùng", example = "2")
    private Long userId;

    @Schema(description = "Email", example = "farmer1@marketlink.com")
    private String email;

    @Schema(description = "Họ và tên", example = "Nguyễn Văn Nông")
    private String fullName;

    @Schema(description = "Số điện thoại", example = "0901234567")
    private String phoneNumber;

    @Schema(description = "Ảnh đại diện")
    private String avatarUrl;

    @Schema(description = "Trạng thái tài khoản: ACTIVE, SUSPENDED, PENDING", example = "ACTIVE")
    private String status;

    @Schema(description = "Trạng thái KYC: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "VERIFIED")
    private String kycStatus;

    @Schema(description = "Danh sách vai trò", example = "[\"ROLE_FARMER\"]")
    private List<String> roles;

    @Schema(description = "Đã xác minh email", example = "true")
    private Boolean isEmailVerified;

    @Schema(description = "Đã xác minh số điện thoại", example = "true")
    private Boolean isPhoneVerified;

    @Schema(description = "Thời gian tạo tài khoản")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật gần nhất")
    private LocalDateTime updatedAt;

    // Chi tiết nếu là Farmer
    @Schema(description = "Tên gian hàng / tên nông trại")
    private String stallName;

    @Schema(description = "Tiểu sử nông trại")
    private String bio;

    @Schema(description = "Địa chỉ nông trại")
    private String farmAddress;

    @Schema(description = "Tọa độ vĩ độ")
    private BigDecimal latitude;

    @Schema(description = "Tọa độ kinh độ")
    private BigDecimal longitude;

    @Schema(description = "Nông dân đã được phê duyệt bán hàng hay chưa")
    private Boolean isApproved;

    // Chi tiết nếu là Customer
    @Schema(description = "Địa chỉ nhận hàng mặc định")
    private String defaultAddress;

    @Schema(description = "ID tài khoản chủ gia đình nếu tham gia nhóm gia đình")
    private Long familyAccountId;

    @Schema(description = "Danh sách lịch sử kiểm duyệt của người dùng này")
    private List<VerificationAuditLogResponse> auditLogs;
}
