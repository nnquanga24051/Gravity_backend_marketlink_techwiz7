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

    @NotNull(message = "Product ID (productId) cannot be null")
    private Long productId;

    @NotNull(message = "Quantity cannot be null")
    @DecimalMin(value = "0.01", message = "Minimum quantity is 0.01")
    private BigDecimal quantity;
}
