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

    @Column("target_type")
    private String targetType; // FARMER_KYC, USER_EMAIL, USER_PHONE

    @Column("target_id")
    private Long targetId;

    @Column("action_taken")
    private String actionTaken; // APPROVED, REJECTED, SUSPENDED

    private String notes;

    @Column("performed_by")
    private Long performedBy;

    @Column("created_at")
    private LocalDateTime createdAt;
}
