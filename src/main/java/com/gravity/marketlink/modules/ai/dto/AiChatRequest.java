package com.gravity.marketlink.modules.ai.dto;

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
public class AiChatRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Schema(description = "Câu hỏi của người dùng về chợ, nông dân, sản phẩm hoặc giờ mở cửa", example = "Chợ nào mở vào Chủ nhật và có bán rau sạch không?")
    private String message;

    @Schema(description = "Tùy chọn: API Key của Google Gemini (nếu để trống hệ thống sẽ dùng cấu hình mặc định trên server)", example = "AIzaSy...")
    private String apiKey;
}
