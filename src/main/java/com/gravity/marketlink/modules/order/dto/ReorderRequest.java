package com.gravity.marketlink.modules.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderRequest {

    @NotNull(message = "Ngày nhận hàng không được để trống")
    @Schema(description = "Ngày nhận hàng mới tại chợ", example = "2026-10-05")
    private LocalDate pickupDate;

    @NotNull(message = "Khung giờ nhận hàng không được để trống")
    @Schema(description = "ID ca nhận hàng mới", example = "2")
    private Long slotId;

    @Schema(description = "Ghi chú thêm cho đơn hàng mới", example = "Đặt lại giống đơn trước, đóng gói cẩn thận giúp mình nhé")
    private String note;
}
