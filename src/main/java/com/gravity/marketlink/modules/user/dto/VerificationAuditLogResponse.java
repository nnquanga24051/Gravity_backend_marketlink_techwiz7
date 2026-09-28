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
@Schema(description = "Identity verification or account audit log")
public class VerificationAuditLogResponse {

    @Schema(description = "Audit log ID", example = "1")
    private Long logId;

    @Schema(description = "Audited user ID", example = "2")
    private Long targetUserId;

    @Schema(description = "Reviewer Admin ID", example = "1")
    private Long adminId;

    @Schema(description = "Reviewer Admin name", example = "Admin MarketLink")
    private String adminName;

    @Schema(description = "Audit action: APPROVE, REJECT, REQUEST_REVISION, SUSPEND", example = "APPROVE")
    private String action;

    @Schema(description = "Administrator reason or notes", example = "Valid documents, active VietGAP certificate verified.")
    private String reason;

    @Schema(description = "Audit timestamp")
    private LocalDateTime reviewedAt;
}
