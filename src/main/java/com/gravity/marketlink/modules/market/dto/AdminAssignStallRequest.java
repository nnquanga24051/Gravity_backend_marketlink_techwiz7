package com.gravity.marketlink.modules.market.dto;

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
@Schema(description = "Yêu cầu Admin chỉ định hoặc cập nhật phân sạp chợ cho nông dân")
public class AdminAssignStallRequest {

    @NotNull(message = "ID nông dân không được để trống")
    @Schema(description = "User ID của nông dân", example = "5")
    private Long farmerId;

    @NotNull(message = "ID chợ không được để trống")
    @Schema(description = "Market ID của chợ nông sản", example = "1")
    private Long marketId;

    @NotBlank(message = "Số sạp không được để trống")
    @Schema(description = "Mã số / vị trí gian hàng tại chợ", example = "Sạp A-08")
    private String stallNumber;

    @Schema(description = "Trạng thái phê duyệt (ACTIVE, REGISTERED, REVOKED). Mặc định là ACTIVE", example = "ACTIVE")
    private String status;
}
