package com.gravity.marketlink.modules.ai.dto;

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
public class AiChatResponse {

    @Schema(description = "Câu trả lời thông minh từ trợ lý AI", example = "Chào bạn! Hiện tại có Chợ Phiên Ba Vì họp vào Chủ nhật (07:00 - 11:30) với 4 sạp nông sản sạch sẵn sàng phục vụ.")
    private String reply;

    @Schema(description = "Danh sách phiên chợ phù hợp được tìm thấy")
    private List<String> relevantMarkets;

    @Schema(description = "Danh sách nông sản liên quan")
    private List<String> relevantProducts;

    @Schema(description = "Khung giờ nhận hàng hoặc lưu ý chốt đơn")
    private String timingNotes;
}
