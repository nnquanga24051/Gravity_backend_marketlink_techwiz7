package com.gravity.marketlink.modules.auth.entity;

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
@Table("users")
public class User {

    @Id
    @Column("user_id")
    private Long userId;

    private String email;

    @Column("is_email_verified")
    private Boolean isEmailVerified;

    @Column("password_hash")
    private String passwordHash;

    @Column("phone_number")
    private String phoneNumber;

    @Column("is_phone_verified")
    private Boolean isPhoneVerified;

    @Column("full_name")
    private String fullName;

    @Column("avatar_url")
    private String avatarUrl;

    @Builder.Default
    private String status = "ACTIVE";

    @Column("kyc_status")
    @Builder.Default
    private String kycStatus = "UNVERIFIED";

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
