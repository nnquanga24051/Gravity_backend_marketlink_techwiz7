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
@Schema(description = "Yêu cầu Quản trị viên duyệt hồ sơ KYC của Nông dân")
public class AdminKycReviewRequest {

    @NotBlank(message = "Hành động phê duyệt không được để trống")
    @Schema(description = "Hành động: APPROVE, REJECT, REQUEST_REVISION", example = "APPROVE")
    private String action;

    @Schema(description = "Lý do hoặc ghi chú phản hồi cho nông dân", example = "Hồ sơ hợp lệ, đã đối chiếu mã số chứng nhận VietGAP thành công.")
    private String reason;
}
