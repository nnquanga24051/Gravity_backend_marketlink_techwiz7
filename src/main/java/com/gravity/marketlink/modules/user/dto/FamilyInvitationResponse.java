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
@Schema(description = "Thông tin lời mời tham gia nhóm gia đình")
public class FamilyInvitationResponse {

    @Schema(description = "ID lời mời", example = "1")
    private Long invitationId;

    @Schema(description = "ID người mời (Customer Head)", example = "3")
    private Long inviterId;

    @Schema(description = "Họ tên người mời", example = "Nguyễn Văn Chồng")
    private String inviterName;

    @Schema(description = "Email người được mời", example = "family_member@marketlink.com")
    private String inviteeEmail;

    @Schema(description = "Mã token lời mời", example = "550e8400-e29b-41d4-a716-446655440000")
    private String invitationToken;

    @Schema(description = "Trạng thái lời mời: PENDING, ACCEPTED, REJECTED, EXPIRED", example = "PENDING")
    private String status;

    @Schema(description = "Thời gian hết hạn của lời mời")
    private LocalDateTime expiresAt;

    @Schema(description = "Thời gian tạo lời mời")
    private LocalDateTime createdAt;
}
