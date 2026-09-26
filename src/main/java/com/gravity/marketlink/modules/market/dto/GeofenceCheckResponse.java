package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kết quả kiểm tra vùng địa lý Geofence quanh phiên chợ")
public class GeofenceCheckResponse {

    @Schema(description = "Trạng thái có đang ở trong bán kính 300m quanh chợ không", example = "true")
    private Boolean inGeofence;

    @Schema(description = "Khoảng cách hiện tại tới cổng chợ (mét)", example = "145.5")
    private Double distanceMeters;

    @Schema(description = "ID chợ phát hiện gần nhất", example = "101")
    private Long marketId;

    @Schema(description = "Tên chợ nông sản", example = "Phiên Chợ Xanh Nông Sản Ba Đình")
    private String marketName;

    @Schema(description = "Thông điệp chào mừng hiển thị trên ứng dụng", example = "Chào mừng bạn đến Phiên Chợ Xanh Nông Sản Ba Đình! Đơn hàng của bạn đã sẵn sàng nhận tại sạp.")
    private String alertMessage;

    @Schema(description = "Số lượng thông báo đã phát tới các sạp nông dân có đơn", example = "2")
    private Integer notifiedFarmersCount;

    @Schema(description = "Danh sách mã đơn hàng của khách tại phiên chợ hôm nay")
    private List<String> todayOrderCodes;
}
