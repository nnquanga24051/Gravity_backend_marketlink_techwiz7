package com.gravity.marketlink.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class WeeklyStockTemplateRequest {

    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Mã chợ phiên không được để trống")
    private Long marketId;

    @NotNull(message = "Thứ trong tuần không được để trống")
    @Min(value = 1, message = "Thứ trong tuần từ 1 (Thứ Hai) đến 7 (Chủ Nhật)")
    @Max(value = 7, message = "Thứ trong tuần từ 1 (Thứ Hai) đến 7 (Chủ Nhật)")
    private Integer dayOfWeek;

    @NotNull(message = "Số lượng định mức không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số lượng định mức phải lớn hơn 0")
    private BigDecimal recurringQuantity;

    @Builder.Default
    private Boolean isActive = true;
}
