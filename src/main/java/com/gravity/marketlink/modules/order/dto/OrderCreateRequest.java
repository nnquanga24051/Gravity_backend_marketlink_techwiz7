package com.gravity.marketlink.modules.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Mã nông dân (farmerId) không được để trống")
    private Long farmerId;

    @NotNull(message = "Mã chợ (marketId) không được để trống")
    private Long marketId;

    @NotNull(message = "Khung giờ nhận hàng (slotId) không được để trống")
    private Long slotId;

    @NotNull(message = "Ngày nhận hàng (pickupDate) không được để trống")
    @Schema(example = "2026-09-27", description = "Ngày khách đến nhận hàng tại chợ")
    private LocalDate pickupDate;

    private String note;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<OrderItemRequest> items;
}
