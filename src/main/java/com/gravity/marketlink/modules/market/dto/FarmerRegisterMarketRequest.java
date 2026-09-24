package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu đăng ký tham gia bán hàng tại chợ nông sản (Dành cho Nông dân)")
public class FarmerRegisterMarketRequest {

    @NotNull(message = "Mã chợ không được để trống")
    @Schema(description = "Mã định danh chợ muốn tham gia", example = "1")
    private Long marketId;

    @Schema(description = "Số hiệu sạp mong muốn (nếu có)", example = "Sạp A05")
    private String stallNumber;
}
