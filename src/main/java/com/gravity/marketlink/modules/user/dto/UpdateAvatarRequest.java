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
@Schema(description = "Dữ liệu cập nhật ảnh đại diện người dùng")
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar không được để trống")
    @Schema(description = "Đường dẫn URL của ảnh đại diện mới", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;
}
