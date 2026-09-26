package com.gravity.marketlink.modules.order.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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
    @JsonAlias({"newStatus", "status"})
    private String orderStatus;

    @Schema(description = "Lý do (nếu từ chối đơn hàng)")
    private String reason;

    public void setNewStatus(String newStatus) {
        if (this.orderStatus == null || this.orderStatus.isBlank()) {
            this.orderStatus = newStatus;
        }
    }
}

