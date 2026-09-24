package com.gravity.marketlink.modules.ai.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.ai.dto.AiChatRequest;
import com.gravity.marketlink.modules.ai.dto.AiChatResponse;
import com.gravity.marketlink.modules.ai.service.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Tag(name = "7. Trợ lý AI thông minh (AI Assistant - Optional)", description = "API trợ lý ảo trả lời câu hỏi của khách hàng về thời gian mở cửa chợ, sạp nông dân và nông sản sẵn có")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @Operation(summary = "Hỏi đáp với Trợ lý AI (AI Chatbot)", description = "Đặt câu hỏi về ngày họp chợ, giờ mở/đóng cửa, tìm kiếm nông sản và sạp nông dân đang mở bán.")
    @PostMapping(value = {"/chat", "/assistant/chat"})
    public Mono<ResponseEntity<ApiResponse<AiChatResponse>>> chatWithAssistant(@Valid @RequestBody AiChatRequest request) {
        return aiAssistantService.answerQuery(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success("Trợ lý AI trả lời thành công.", response)));
    }

    @Operation(summary = "Hỏi đáp với Trợ lý AI thời gian thực (Streaming SSE)", description = "Nhận phản hồi từng từ theo thời gian thực (Server-Sent Events) giống ChatGPT.")
    @PostMapping(value = {"/chat/stream", "/assistant/chat/stream", "/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChatWithAssistant(@Valid @RequestBody AiChatRequest request) {
        return aiAssistantService.streamQuery(request);
    }
}
