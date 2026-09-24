package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteRequest {

    @NotBlank(message = "Loại đối tượng yêu thích không được để trống")
    @Schema(example = "PRODUCT", description = "Các loại hợp lệ: FARMER, PRODUCT, MARKET")
    private String targetType;

    @NotNull(message = "Mã đối tượng (targetId) không được để trống")
    private Long targetId;
}
