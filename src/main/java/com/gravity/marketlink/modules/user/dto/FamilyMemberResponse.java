package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin thành viên trong nhóm tài khoản gia đình (Family Account)")
public class FamilyMemberResponse {

    @Schema(description = "ID khách hàng", example = "3")
    private Long customerId;

    @Schema(description = "Họ và tên", example = "Nguyễn Văn Vợ")
    private String fullName;

    @Schema(description = "Email", example = "wife@marketlink.com")
    private String email;

    @Schema(description = "Số điện thoại", example = "0987111222")
    private String phoneNumber;

    @Schema(description = "Ảnh đại diện")
    private String avatarUrl;

    @Schema(description = "Là chủ nhóm gia đình hay thành viên phụ thuộc", example = "false")
    private Boolean isHeadOfFamily;

    @Schema(description = "Địa chỉ nhận hàng mặc định")
    private String defaultAddress;

    @Schema(description = "Thời gian tham gia")
    private LocalDateTime joinedAt;
}
