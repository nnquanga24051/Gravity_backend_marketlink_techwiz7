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
public class OrderModifyRequest {

    @NotNull(message = "Ngày nhận hàng không được để trống")
    @Schema(description = "Ngày nhận hàng điều chỉnh", example = "2026-10-02")
    private LocalDate pickupDate;

    @NotNull(message = "Ca nhận hàng không được để trống")
    @Schema(description = "ID ca nhận hàng mới", example = "3")
    private Long slotId;

    @Schema(description = "Ghi chú cập nhật cho đơn hàng", example = "Chuyển sang nhận ca chiều giúp mình nhé")
    private String note;
}
