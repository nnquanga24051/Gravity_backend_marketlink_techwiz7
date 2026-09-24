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
    private String verificationType; // EMAIL_CONFIRMATION, PHONE_OTP, PASSWORD_RESET

    @Column("verification_code")
    private String verificationCode;

    @Column("target_destination")
    private String targetDestination;

    @Column("is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column("attempts_count")
    @Builder.Default
    private Integer attemptsCount = 0;

    @Column("expires_at")
    private LocalDateTime expiresAt;

    @Column("created_at")
    private LocalDateTime createdAt;
}
