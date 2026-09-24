package com.gravity.marketlink.modules.market.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết sạp nông dân đang kinh doanh tại chợ")
public class FarmerAtMarketResponse {

    @Schema(description = "Mã phân công sạp", example = "1")
    private Long assignmentId;

    @Schema(description = "Mã định danh nông dân", example = "2")
    private Long farmerId;

    @Schema(description = "Mã chợ", example = "1")
    private Long marketId;

    @Schema(description = "Số hiệu vị trí sạp tại chợ", example = "Sạp A12")
    private String stallNumber;

    @Schema(description = "Trạng thái sạp (ACTIVE, REGISTERED, REVOKED)", example = "ACTIVE")
    private String status;

    @Schema(description = "Tên gian hàng / Sạp nông sản", example = "Sạp Rau Củ Hữu Cơ Ba Đình")
    private String stallName;

    @Schema(description = "Tên đầy đủ của chủ nông trại", example = "Nguyễn Văn Nông Dân")
    private String farmerName;

    @Schema(description = "Tiểu sử / Giới thiệu nông trại", example = "Chuyên canh rau sạch VietGAP không thuốc trừ sâu")
    private String bio;

    @Schema(description = "Địa chỉ trang trại", example = "Thôn 2, Xã Yên Bài, Ba Vì, Hà Nội")
    private String farmAddress;

    @Schema(description = "Tọa độ vĩ độ trang trại", example = "21.050000")
    private BigDecimal latitude;

    @Schema(description = "Tọa độ kinh độ trang trại", example = "105.780000")
    private BigDecimal longitude;

    @Schema(description = "Ảnh đại diện", example = "https://images.unsplash.com/photo-1544005313-94ddf0286df2")
    private String avatarUrl;

    @Schema(description = "Số điện thoại liên hệ", example = "0912345678")
    private String phoneNumber;
}
