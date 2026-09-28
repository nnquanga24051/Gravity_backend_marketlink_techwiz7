package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Send family member invitation request (Family Account)")
public class FamilyInviteRequest {

    @NotBlank(message = "Invited member email cannot be blank")
    @Email(message = "Invalid email format for invited member")
    @Schema(description = "Email address of family member to invite", example = "family_member@marketlink.com")
    private String inviteeEmail;
}
