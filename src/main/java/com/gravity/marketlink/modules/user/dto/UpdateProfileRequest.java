package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dữ liệu yêu cầu cập nhật hồ sơ cá nhân")
public class UpdateProfileRequest {

    @Schema(description = "Họ và tên", example = "Nguyễn Văn Nông Dân")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    @Size(max = 20, message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Schema(description = "Đường dẫn ảnh đại diện (Avatar URL)", example = "https://images.unsplash.com/photo-1534528741775-53994a69daeb")
    private String avatarUrl;

    // --- Thông tin dành riêng cho Khách hàng (Customer) ---
    @Schema(description = "Địa chỉ giao hàng mặc định (Dành cho Customer)", example = "Số 123 Đường Láng, Đống Đa, Hà Nội")
    private String defaultAddress;

    @Schema(description = "Tọa độ vĩ độ (Latitude)", example = "21.028511")
    private BigDecimal latitude;

    @Schema(description = "Tọa độ kinh độ (Longitude)", example = "105.804817")
    private BigDecimal longitude;

    // --- Thông tin dành riêng cho Nông dân (Farmer) ---
    @Schema(description = "Tên gian hàng / Sạp nông sản (Dành cho Farmer)", example = "Sạp Rau Củ Hữu Cơ Ba Đình")
    private String stallName;

    @Schema(description = "Tiểu sử / giới thiệu nhà vườn (Dành cho Farmer)", example = "Trang trại hữu cơ đạt chuẩn VietGAP, chuyên rau củ sạch.")
    private String bio;

    @Schema(description = "Địa chỉ trang trại (Dành cho Farmer)", example = "Thôn 2, Xã Yên Bài, Ba Vì, Hà Nội")
    private String farmAddress;
}
