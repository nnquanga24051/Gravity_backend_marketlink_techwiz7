package com.gravity.marketlink.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kết quả gửi/xác minh mã OTP")
public class OtpResponse {

    @Schema(description = "Trạng thái thành công hay thất bại", example = "true")
    private Boolean success;

    @Schema(description = "Thông báo kết quả", example = "Mã OTP đã được gửi thành công.")
    private String message;

    @Schema(description = "Mã OTP (cung cấp trong môi trường test/dev)", example = "123456")
    private String devCode;
}
