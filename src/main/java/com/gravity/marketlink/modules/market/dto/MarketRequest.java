package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu tạo mới hoặc cập nhật chợ nông sản (Dành cho Quản trị viên)")
public class MarketRequest {

    @NotBlank(message = "Tên chợ không được để trống")
    @Schema(description = "Tên điểm chợ nông sản", example = "Chợ Phiên Nông Sản Ba Đình")
    private String name;

    @NotBlank(message = "Địa chỉ thực tế không được để trống")
    @Schema(description = "Địa chỉ chợ", example = "Cung Thể Thao Quần Ngựa, Văn Cao, Ba Đình, Hà Nội")
    private String address;

    @NotNull(message = "Tọa độ vĩ độ (Latitude) không được để trống")
    @Schema(description = "Tọa độ vĩ độ (Latitude)", example = "21.038234")
    private BigDecimal latitude;

    @NotNull(message = "Tọa độ kinh độ (Longitude) không được để trống")
    @Schema(description = "Tọa độ kinh độ (Longitude)", example = "105.817456")
    private BigDecimal longitude;

    @Schema(description = "Mô tả chợ", example = "Chợ họp vào Thứ 7 và Chủ nhật hàng tuần, chuyên đặc sản vùng cao.")
    private String description;

    @Schema(description = "Link ảnh chợ", example = "https://images.unsplash.com/photo-1488459716781-31db52582fe9")
    private String imageUrl;

    @Schema(description = "Trạng thái (ACTIVE / INACTIVE)", example = "ACTIVE")
    private String status;

    @Schema(description = "Danh sách lịch họp chợ định kỳ")
    private List<MarketScheduleDto> schedules;
}
