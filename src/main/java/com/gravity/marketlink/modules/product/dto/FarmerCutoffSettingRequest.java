package com.gravity.marketlink.modules.product.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerCutoffSettingRequest {

    @NotNull(message = "Mã chợ (marketId) không được để trống")
    private Long marketId;

    @NotNull(message = "Thứ trong tuần (dayOfWeek) không được để trống")
    @Min(value = 1, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    @Max(value = 7, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    private Integer dayOfWeek;

    @NotNull(message = "Số giờ chốt đơn trước giờ mở chợ không được để trống")
    @Min(value = 1, message = "Tối thiểu chốt đơn trước 1 giờ")
    @Max(value = 72, message = "Tối đa chốt đơn trước 72 giờ")
    private Integer cutoffHoursBefore;
}
