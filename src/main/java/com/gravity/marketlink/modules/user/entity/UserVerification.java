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
@Table("user_verifications")
public class UserVerification {

    @Id
    @Column("verification_id")
    private Long verificationId;

    @Column("user_id")
    private Long userId;

    @Column("verification_type")
    private String verificationType; // EMAIL, PHONE, PASSWORD_RESET

    private String code;

    @Column("expires_at")
    private LocalDateTime expiresAt;

    @Column("is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
