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
@Schema(description = "Yêu cầu kiểm tra toạ độ định vị Geofencing vùng chợ")
public class GeofenceCheckRequest {

    @NotNull(message = "Vĩ độ (latitude) không được để trống")
    @Schema(description = "Vĩ độ GPS hiện tại", example = "21.0315")
    private Double latitude;

    @NotNull(message = "Kinh độ (longitude) không được để trống")
    @Schema(description = "Kinh độ GPS hiện tại", example = "105.8192")
    private Double longitude;

    @Schema(description = "ID chợ muốn kiểm tra (tùy chọn, nếu không gửi hệ thống tự tìm chợ gần nhất)", example = "101")
    private Long targetMarketId;
}
