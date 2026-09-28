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

    @NotBlank(message = "Question content cannot be blank")
    @Schema(description = "User question about markets, farmers, products, or opening hours", example = "Which farmers market opens on Sunday with organic vegetables?")
    private String message;

    @Schema(description = "Optional: Google Gemini API Key (uses server default if omitted)", example = "AIzaSy...")
    private String apiKey;
}
