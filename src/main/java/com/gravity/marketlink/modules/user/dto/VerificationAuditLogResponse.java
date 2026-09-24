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
@Schema(description = "Nhật ký kiểm duyệt xác minh danh tính hoặc khóa tài khoản")
public class VerificationAuditLogResponse {

    @Schema(description = "ID nhật ký kiểm duyệt", example = "1")
    private Long logId;

    @Schema(description = "ID người dùng bị kiểm duyệt", example = "2")
    private Long targetUserId;

    @Schema(description = "ID Quản trị viên duyệt", example = "1")
    private Long adminId;

    @Schema(description = "Tên Quản trị viên duyệt", example = "Admin MarketLink")
    private String adminName;

    @Schema(description = "Hành động duyệt: APPROVE, REJECT, REQUEST_REVISION, SUSPEND", example = "APPROVE")
    private String action;

    @Schema(description = "Lý do hoặc ghi chú của Quản trị viên", example = "Hồ sơ giấy tờ hợp lệ, chứng nhận VietGAP còn hạn.")
    private String reason;

    @Schema(description = "Thời gian kiểm duyệt")
    private LocalDateTime reviewedAt;
}
