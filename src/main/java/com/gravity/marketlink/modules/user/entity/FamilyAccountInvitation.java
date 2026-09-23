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
@Table("family_account_invitations")
public class FamilyAccountInvitation {

    @Id
    @Column("invitation_id")
    private Long invitationId;

    @Column("inviter_id")
    private Long inviterId;

    @Column("invitee_email")
    private String inviteeEmail;

    @Column("invitee_id")
    private Long inviteeId;

    @Column("invitation_token")
    private String invitationToken;

    @Builder.Default
    private String status = "PENDING";

    @Column("expires_at")
    private LocalDateTime expiresAt;

    @Column("created_at")
    private LocalDateTime createdAt;
}
