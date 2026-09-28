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

    @NotBlank(message = "Order status cannot be blank")
    @Schema(example = "ACCEPTED", description = "Valid statuses: ACCEPTED, READY_FOR_PICKUP, COMPLETED, DECLINED")
    @JsonAlias({"newStatus", "status"})
    private String orderStatus;

    @Schema(description = "Reason (if order is declined)")
    private String reason;

    public void setNewStatus(String newStatus) {
        if (this.orderStatus == null || this.orderStatus.isBlank()) {
            this.orderStatus = newStatus;
        }
    }
}

