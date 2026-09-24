package com.gravity.marketlink.modules.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("verification_audit_logs")
public class VerificationAuditLog {

    @Id
    @Column("log_id")
    private Long logId;

    @Column("target_user_id")
    private Long targetUserId;

    @Column("admin_id")
    private Long adminId;

    @Column("action")
    private String action; // APPROVE, REJECT, REQUEST_REVISION, SUSPEND

    private String reason;

    @Column("reviewed_at")
    private LocalDateTime reviewedAt;
}
