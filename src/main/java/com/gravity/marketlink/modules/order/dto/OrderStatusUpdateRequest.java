package com.gravity.marketlink.modules.order.dto;

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
public class OrderStatusUpdateRequest {

    @NotBlank(message = "Trạng thái đơn hàng không được để trống")
    @Schema(example = "ACCEPTED", description = "Các trạng thái hợp lệ: ACCEPTED, READY_FOR_PICKUP, COMPLETED, DECLINED")
    private String orderStatus;
}
