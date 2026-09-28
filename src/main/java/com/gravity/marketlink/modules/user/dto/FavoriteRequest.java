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

    @NotBlank(message = "Favorite target type cannot be blank")
    @Schema(example = "PRODUCT", description = "Valid types: FARMER, PRODUCT, MARKET")
    private String targetType;

    @NotNull(message = "Target ID (targetId) cannot be null")
    private Long targetId;
}
