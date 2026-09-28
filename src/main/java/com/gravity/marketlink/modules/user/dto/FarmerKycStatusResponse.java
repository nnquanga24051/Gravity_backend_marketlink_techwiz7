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
@Schema(description = "Current KYC verification status of Farmer")
public class FarmerKycStatusResponse {

    @Schema(description = "Farmer ID", example = "2")
    private Long farmerId;

    @Schema(description = "Account KYC status: UNVERIFIED, PENDING, VERIFIED, REJECTED", example = "PENDING")
    private String kycStatus;

    @Schema(description = "Whether farmer has approved selling permission", example = "false")
    private Boolean isApproved;

    @Schema(description = "Latest review notes/feedback from Administrator", example = "Please provide clearer photo of ID card back side")
    private String latestRemark;

    @Schema(description = "List of submitted KYC documents")
    private List<FarmerKycDocumentResponse> documents;

    @Schema(description = "Application moderation history")
    private List<VerificationAuditLogResponse> auditLogs;
}
