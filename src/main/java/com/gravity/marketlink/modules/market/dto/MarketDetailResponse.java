package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết chợ nông sản kèm lịch họp chợ")
public class MarketDetailResponse {

    @Schema(description = "Mã định danh chợ", example = "1")
    private Long marketId;

    @Schema(description = "Tên điểm chợ nông sản", example = "Chợ Phiên Nông Sản Ba Đình")
    private String name;

    @Schema(description = "Địa chỉ thực tế", example = "Cung Thể Thao Quần Ngựa, Văn Cao, Ba Đình, Hà Nội")
    private String address;

    @Schema(description = "Tọa độ vĩ độ (Latitude) để ghim bản đồ", example = "21.038234")
    private BigDecimal latitude;

    @Schema(description = "Tọa độ kinh độ (Longitude) để ghim bản đồ", example = "105.817456")
    private BigDecimal longitude;

    @Schema(description = "Mô tả điểm chợ", example = "Chợ phiên nông sản hữu cơ quy tụ hơn 30 nhà vườn miền Bắc.")
    private String description;

    @Schema(description = "Ảnh đại diện chợ", example = "https://images.unsplash.com/photo-1488459716781-31db52582fe9")
    private String imageUrl;

    @Schema(description = "Trạng thái hoạt động (ACTIVE / INACTIVE)", example = "ACTIVE")
    private String status;

    @Schema(description = "Lịch họp chợ định kỳ theo ngày trong tuần")
    private List<MarketScheduleDto> schedules;

    @Schema(description = "Số lượng sạp nông dân đang tham gia bán", example = "15")
    private Long activeFarmersCount;

    @Schema(description = "Thời điểm khởi tạo")
    private LocalDateTime createdAt;
}
