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
@Schema(description = "Kết quả giải thuật tìm chợ gần nhất và lộ trình đường đi ngắn nhất")
public class RouteResponse {

    @Schema(description = "ID chợ", example = "101")
    private Long marketId;

    @Schema(description = "Tên chợ nông sản", example = "Phiên Chợ Xanh Nông Sản Ba Đình")
    private String marketName;

    @Schema(description = "Địa chỉ chợ", example = "12 Núi Trúc, Phường Giảng Võ, Quận Ba Đình, Hà Nội")
    private String marketAddress;

    @Schema(description = "Vĩ độ của chợ", example = "21.0312")
    private Double marketLatitude;

    @Schema(description = "Kinh độ của chợ", example = "105.8189")
    private Double marketLongitude;

    @Schema(description = "Vĩ độ của khách hàng", example = "21.0185")
    private Double originLatitude;

    @Schema(description = "Kinh độ của khách hàng", example = "105.8290")
    private Double originLongitude;

    @Schema(description = "Khoảng cách thực tế theo mạng lưới đường giao thông (km)", example = "2.8")
    private Double distanceKilometers;

    @Schema(description = "Thời gian di chuyển ước tính (phút)", example = "8")
    private Integer estimatedMinutes;

    @Schema(description = "Tập hợp toạ độ [[lat, lon], ...] để vẽ nét đường đi trên OpenStreetMap Leaflet")
    private List<List<Double>> routeGeometry;

    @Schema(description = "Danh sách các chặng rẽ chỉ đường chi tiết (Turn-by-turn)")
    private List<String> navigationSteps;

    @Schema(description = "Liên kết mở trực tiếp ứng dụng Google Maps Navigation")
    private String googleMapsNavUrl;

    @Schema(description = "Khách hàng có đang trong bán kính Geofencing 300m quanh chợ không", example = "false")
    private Boolean inGeofence;
}
