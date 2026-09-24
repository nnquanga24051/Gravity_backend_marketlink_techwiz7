package com.gravity.marketlink.modules.user.dto;

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
@Schema(description = "Yêu cầu thay đổi trạng thái hoạt động tài khoản người dùng")
public class AdminUpdateUserStatusRequest {

    @NotBlank(message = "Trạng thái mới không được để trống")
    @Schema(description = "Trạng thái mới: ACTIVE, SUSPENDED, PENDING", example = "SUSPENDED")
    private String status;

    @Schema(description = "Lý do khóa hoặc mở khóa tài khoản", example = "Vi phạm chính sách bán hàng hoặc có phản hồi gian lận.")
    private String reason;
}
