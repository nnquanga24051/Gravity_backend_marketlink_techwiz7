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

    @Schema(description = "Intelligent response from AI assistant", example = "Hello! Ba Vi Farmers Market is open this Sunday (07:00 - 11:30) with 4 organic stalls ready to serve you.")
    private String reply;

    @Schema(description = "List of matching farmers markets found")
    private List<String> relevantMarkets;

    @Schema(description = "List of related fresh produce")
    private List<String> relevantProducts;

    @Schema(description = "Pickup time slots or cutoff reminders")
    private String timingNotes;
}
