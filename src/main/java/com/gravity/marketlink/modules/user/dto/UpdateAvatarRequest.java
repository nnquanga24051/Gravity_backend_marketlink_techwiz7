package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User avatar update payload")
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar URL cannot be blank")
    @Schema(description = "URL path of new avatar image", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;
}
