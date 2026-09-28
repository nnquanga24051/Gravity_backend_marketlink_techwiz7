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

@Tag(name = "7. Intelligent AI Assistant (AI Assistant - Optional)", description = "AI assistant APIs for answering customer inquiries regarding market operating hours, farmer stalls, and produce availability")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @Operation(summary = "Chat with AI Assistant (AI Chatbot)", description = "Inquire about market session days, operating hours, search for fresh produce and active farmer stalls.")
    @PostMapping(value = {"/chat", "/assistant/chat"})
    public Mono<ResponseEntity<ApiResponse<AiChatResponse>>> chatWithAssistant(@Valid @RequestBody AiChatRequest request) {
        return aiAssistantService.answerQuery(request)
                .map(response -> ResponseEntity.ok(ApiResponse.success("AI Assistant responded successfully.", response)));
    }

    @Operation(summary = "Chat with AI Assistant in real-time (Streaming SSE)", description = "Stream word-by-word responses in real-time using Server-Sent Events.")
    @PostMapping(value = {"/chat/stream", "/assistant/chat/stream", "/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChatWithAssistant(@Valid @RequestBody AiChatRequest request) {
        return aiAssistantService.streamQuery(request);
    }
}
