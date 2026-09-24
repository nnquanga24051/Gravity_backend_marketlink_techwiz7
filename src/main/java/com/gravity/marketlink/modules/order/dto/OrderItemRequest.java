package com.gravity.marketlink.modules.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {

    @NotNull(message = "Mã sản phẩm (productId) không được để trống")
    private Long productId;

    @NotNull(message = "Số lượng đặt không được để trống")
    @DecimalMin(value = "0.01", message = "Số lượng đặt tối thiểu là 0.01")
    private BigDecimal quantity;
}
