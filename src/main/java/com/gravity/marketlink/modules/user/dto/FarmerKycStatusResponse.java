package com.gravity.marketlink.modules.user.dto;

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
@Schema(description = "Tình trạng hồ sơ KYC hiện tại của Nông dân")
public class FarmerKycStatusResponse {

    @Schema(description = "ID Nông dân", example = "2")
    private Long farmerId;

    @Schema(description = "Trạng thái KYC tài khoản: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "PENDING")
    private String kycStatus;

    @Schema(description = "Đã được phê duyệt bán hàng hay chưa", example = "false")
    private Boolean isApproved;

    @Schema(description = "Ghi chú/lý do kiểm duyệt gần nhất từ Quản trị viên", example = "Cần chụp rõ nét lại mặt sau CCCD")
    private String latestRemark;

    @Schema(description = "Danh sách tài liệu KYC đã nộp")
    private List<FarmerKycDocumentResponse> documents;

    @Schema(description = "Lịch sử kiểm duyệt hồ sơ")
    private List<VerificationAuditLogResponse> auditLogs;
}
