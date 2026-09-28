package com.gravity.marketlink.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gravity.marketlink.modules.ai.dto.AiChatRequest;
import com.gravity.marketlink.modules.ai.dto.AiChatResponse;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.entity.MarketSchedule;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.market.repository.MarketScheduleRepository;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final MarketRepository marketRepository;
    private final MarketScheduleRepository scheduleRepository;
    private final ProductRepository productRepository;

    @Value("${ai.gemini.api-key:}")
    private String serverApiKey;

    @Value("${ai.gemini.model:gemini-3.6-flash}")
    private String geminiModel;

    @Value("${ai.gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebClient webClient = WebClient.builder().build();

    /**
     * Phản hồi câu hỏi người dùng bằng mô hình ngôn ngữ lớn (LLM - Google Gemini)
     * Ngôn ngữ phản hồi tự động theo ngôn ngữ người dùng hỏi, mặc định là Tiếng Anh.
     */
    public Mono<AiChatResponse> answerQuery(AiChatRequest request) {
        String userQuery = (request.getMessage() != null) ? request.getMessage().trim() : "";
        if (userQuery.isEmpty()) {
            return Mono.just(AiChatResponse.builder()
                    .reply("🌿 Xin chào! Mình là Trợ lý AI của MarketLink. Hãy hỏi mình về các phiên chợ, nông sản tươi ngon hoặc cách đặt hàng trước nhé!\n\nHello! I am the MarketLink AI Assistant 🌿. Ask me about market sessions, fresh organic produce, or pre-ordering guidelines!")
                    .relevantMarkets(List.of())
                    .relevantProducts(List.of())
                    .build());
        }

        Mono<List<Market>> marketsMono = marketRepository.findAll().collectList();
        Mono<List<MarketSchedule>> schedulesMono = scheduleRepository.findAll().collectList();
        Mono<List<Product>> productsMono = productRepository.findByStatus("AVAILABLE").collectList();

        return Mono.zip(marketsMono, schedulesMono, productsMono)
                .flatMap(tuple -> {
                    List<Market> markets = tuple.getT1();
                    List<MarketSchedule> schedules = tuple.getT2();
                    List<Product> products = tuple.getT3();

                    List<String> matchedMarkets = extractMatchedMarkets(markets, schedules, userQuery);
                    List<String> matchedProducts = extractMatchedProducts(products, userQuery);

                    String effectiveKey = (request.getApiKey() != null && !request.getApiKey().isBlank())
                            ? request.getApiKey().trim()
                            : (serverApiKey != null ? serverApiKey.trim() : "");

                    if (effectiveKey.isEmpty()) {
                        return Mono.just(AiChatResponse.builder()
                                .reply("🌿 Trợ lý AI hiện chưa được cấu hình khóa API. Vui lòng liên hệ quản trị viên hệ thống để được hỗ trợ nhé!\n\nThe AI Assistant API key is not configured yet. Please contact the system administrator.")
                                .relevantMarkets(matchedMarkets)
                                .relevantProducts(matchedProducts)
                                .build());
                    }

                    String prompt = buildPrompt(markets, schedules, products, userQuery);
                    return callGeminiApi(prompt, effectiveKey)
                            .map(replyText -> AiChatResponse.builder()
                                    .reply(replyText)
                                    .relevantMarkets(matchedMarkets)
                                    .relevantProducts(matchedProducts)
                                    .timingNotes("Note: You should pre-order produce at least 12 hours before the market session so farmers can harvest the freshest produce! / Bạn nên đặt trước ít nhất 12 giờ trước phiên chợ.")
                                    .build());
                });
    }

    /**
     * Phản hồi theo thời gian thực dạng Streaming (Server-Sent Events)
     */
    public Flux<String> streamQuery(AiChatRequest request) {
        String userQuery = (request.getMessage() != null) ? request.getMessage().trim() : "";
        if (userQuery.isEmpty()) {
            return streamTokens("🌿 Xin chào! Mình là Trợ lý AI MarketLink. Hãy hỏi mình về các phiên chợ và nông sản tươi ngon hôm nay nhé!\n\nHello! I am the MarketLink AI Assistant 🌿. How may I help you today?");
        }

        Mono<List<Market>> marketsMono = marketRepository.findAll().collectList();
        Mono<List<MarketSchedule>> schedulesMono = scheduleRepository.findAll().collectList();
        Mono<List<Product>> productsMono = productRepository.findByStatus("AVAILABLE").collectList();

        return Mono.zip(marketsMono, schedulesMono, productsMono)
                .flatMapMany(tuple -> {
                    List<Market> markets = tuple.getT1();
                    List<MarketSchedule> schedules = tuple.getT2();
                    List<Product> products = tuple.getT3();

                    String effectiveKey = (request.getApiKey() != null && !request.getApiKey().isBlank())
                            ? request.getApiKey().trim()
                            : (serverApiKey != null ? serverApiKey.trim() : "");

                    if (effectiveKey.isEmpty()) {
                        return streamTokens("🌿 Trợ lý AI hiện chưa được cấu hình khóa API. Vui lòng liên hệ quản trị viên để được hỗ trợ!");
                    }

                    String prompt = buildPrompt(markets, schedules, products, userQuery);
                    String streamUrl = String.format("%s/%s:streamGenerateContent?alt=sse&key=%s",
                            geminiApiUrl, geminiModel, effectiveKey);

                    Map<String, Object> body = Map.of(
                            "contents", List.of(
                                    Map.of("parts", List.of(Map.of("text", prompt)))),
                            "generationConfig", Map.of(
                                    "maxOutputTokens", 800,
                                    "temperature", 0.7));

                    return webClient.post()
                            .uri(streamUrl)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header("X-goog-api-key", effectiveKey)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToFlux(String.class)
                            .map(this::extractTextFromSseChunk)
                            .filter(s -> !s.isEmpty())
                             .onErrorResume(err -> {
                                log.error("Gemini stream error caught: {}", err.getMessage());
                                String msg = err.getMessage() != null ? err.getMessage() : "";
                                String errOut;
                                if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
                                    errOut = "🙏 Hệ thống AI đang nhận quá nhiều yêu cầu cùng lúc (giới hạn miễn phí: 15 câu/phút). Bạn vui lòng đợi khoảng 30 giây rồi hỏi lại nhé!\n\nThe AI is a bit busy right now. Please wait about 30 seconds and try again! 🌿";
                                } else if (msg.contains("401") || msg.contains("403")) {
                                    errOut = "🙏 Trợ lý AI hiện đang được kiểm tra bảo mật. Vui lòng liên hệ quản trị viên hệ thống để được hỗ trợ!\n\nThe AI authentication is being checked. Please contact the administrator.";
                                } else {
                                    errOut = "🙏 Xin lỗi, mình gặp chút trục trặc kết nối. Bạn thử lại sau vài giây nhé!\n\nSorry, I ran into a small hiccup. Please try again in a moment! 🌿";
                                }
                                return streamTokens(errOut);
                            });
                });
    }

    /**
     * Gọi Google Gemini API để tạo nội dung trả lời (Generative AI)
     */
    private Mono<String> callGeminiApi(String prompt, String apiKey) {
        String url = String.format("%s/%s:generateContent?key=%s", geminiApiUrl, geminiModel, apiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "maxOutputTokens", 800,
                        "temperature", 0.7));

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-goog-api-key", apiKey)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(60))
                .map(this::parseGeminiResponse)
                .onErrorResume(e -> {
                    log.error("Google Gemini API call failed: {}", e.getMessage());
                    String errText = (e.getMessage() != null) ? e.getMessage() : "";
                    String friendlyMsg;
                    if (errText.contains("429") || errText.contains("RESOURCE_EXHAUSTED")) {
                        friendlyMsg = "🙏 Hệ thống AI đang nhận quá nhiều yêu cầu cùng lúc (giới hạn miễn phí Google: 15 câu/phút). Bạn vui lòng đợi khoảng 30 giây rồi hỏi lại mình nhé!\n\nThe AI is a bit busy right now (Google free limit: 15 req/min). Please wait about 30 seconds and try again! 🌿";
                    } else if (errText.contains("401") || errText.contains("403")) {
                        friendlyMsg = "🙏 Trợ lý AI hiện đang được kiểm tra bảo mật. Vui lòng liên hệ quản trị viên hệ thống để được hỗ trợ.\n\nThe AI authentication is being checked. Please contact the system administrator.";
                    } else {
                        friendlyMsg = "🙏 Xin lỗi, mình gặp chút trục trặc kết nối. Bạn thử lại sau vài giây nhé!\n\nSorry, I ran into a small hiccup connecting to the AI service. Please try again in a moment! 🌿";
                    }
                    return Mono.just(friendlyMsg);
                });
    }

    /**
     * Bóc tách câu trả lời từ JSON trả về của Gemini API
     */
    private String parseGeminiResponse(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return "No response received from AI.";
        }
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText();
                    if (text != null && !text.isBlank()) {
                        return text.trim();
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Failed to parse Gemini response: {}", ex.getMessage());
        }
        return "Could not parse AI response.";
    }

    /**
     * Tạo System Prompt thông minh kết hợp dữ liệu thực tế từ cơ sở dữ liệu sàn MarketLink.
     * Quy định nghiêm ngặt: Phản hồi bằng chính ngôn ngữ người dùng hỏi, mặc định là Tiếng Anh (English).
     */
    private String buildPrompt(List<Market> markets, List<MarketSchedule> schedules, List<Product> products, String userQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are the intelligent AI Assistant for MarketLink Agricultural Produce Platform (connecting local farmers directly with consumers at traditional farmers' markets).\n\n");
        sb.append("CRITICAL LANGUAGE REQUIREMENTS:\n");
        sb.append("1. You MUST detect and respond in the EXACT SAME LANGUAGE that the user is using in their query.\n");
        sb.append("   - If the user writes in Vietnamese -> Respond in natural, polite, fluent Vietnamese.\n");
        sb.append("   - If the user writes in English -> Respond in natural, polite, fluent English.\n");
        sb.append("   - If the user writes in other languages -> Respond in that respective language.\n");
        sb.append("2. DEFAULT LANGUAGE: If the user's inquiry language is ambiguous or unclear, you MUST ALWAYS DEFAULT TO ENGLISH.\n\n");

        sb.append("MISSION & PLATFORM GUIDELINES:\n");
        sb.append("- Answer user inquiries accurately, concisely, politely, and helpfully based on the actual platform data provided below.\n");
        sb.append("- If the inquiry is about markets, session schedules, available produce, or prices, utilize the platform records below.\n");
        sb.append("- If the user asks about culinary recipes, food preparation, ingredient substitution, or casual greetings, answer enthusiastically and helpfully using broad culinary knowledge, relating back to fresh market produce.\n");
        sb.append("- Purchasing model: Customers pre-order on web/app -> choose a pickup time slot at the farmer's market stall -> inspect produce directly at the stall and pay upon pickup (PAY_AT_PICKUP via cash or QR/bank transfer). Home delivery is NOT supported.\n\n");

        sb.append("--- MARKET LOCATIONS & SESSION SCHEDULES ---\n");
        int marketCount = 0;
        for (Market m : markets) {
            sb.append(String.format("• Market: %s (Address: %s)\n", m.getName(), m.getAddress()));
            List<MarketSchedule> mSchedules = schedules.stream()
                    .filter(s -> s.getMarketId().equals(m.getMarketId()))
                    .toList();
            for (MarketSchedule s : mSchedules) {
                String dayName = switch (s.getDayOfWeek()) {
                    case 1 -> "Monday / Thứ 2";
                    case 2 -> "Tuesday / Thứ 3";
                    case 3 -> "Wednesday / Thứ 4";
                    case 4 -> "Thursday / Thứ 5";
                    case 5 -> "Friday / Thứ 6";
                    case 6 -> "Saturday / Thứ 7";
                    case 7 -> "Sunday / Chủ Nhật";
                    default -> "Day " + s.getDayOfWeek();
                };
                sb.append(String.format("   + Schedule: %s (%s - %s)\n", dayName, s.getOpenTime(), s.getCloseTime()));
            }
            marketCount++;
            if (marketCount >= 25)
                break;
        }

        sb.append("\n--- FRESH AGRICULTURAL PRODUCE IN STOCK ---\n");
        int productCount = 0;
        for (Product p : products) {
            String stockStr = p.getCurrentStock() != null ? p.getCurrentStock().stripTrailingZeros().toPlainString()
                    : "Available";
            sb.append(String.format("• %s: %,.0f VND/%s (In stock: %s)\n", p.getName(), p.getPrice(), p.getUnit(),
                    stockStr));
            productCount++;
            if (productCount >= 30)
                break;
        }

        sb.append("\nUSER INQUIRY: \"").append(userQuery).append("\"\n");
        sb.append("AI ASSISTANT RESPONSE (Respond strictly in the user's language, default to English):");
        return sb.toString();
    }

    private Flux<String> streamTokens(String text) {
        String[] words = text.split("(?<=\\s)|(?<=[.,!?])");
        return Flux.fromArray(words)
                .delayElements(Duration.ofMillis(25));
    }

    private String extractTextFromSseChunk(String chunk) {
        if (chunk == null || chunk.isBlank())
            return "";
        StringBuilder sb = new StringBuilder();
        try {
            String[] lines = chunk.split("\r?\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.startsWith("data:")) {
                    trimmed = trimmed.substring(5).trim();
                }
                if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                    JsonNode root = objectMapper.readTree(trimmed);
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            for (JsonNode part : parts) {
                                String t = part.path("text").asText("");
                                if (!t.isEmpty()) {
                                    sb.append(t);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return sb.toString();
    }

    private List<String> extractMatchedMarkets(List<Market> markets, List<MarketSchedule> schedules, String userQuery) {
        List<String> matched = new ArrayList<>();
        String lower = userQuery.toLowerCase(Locale.ROOT);
        for (Market m : markets) {
            if (lower.contains(m.getName().toLowerCase(Locale.ROOT))) {
                matched.add(m.getName() + " (" + m.getAddress() + ")");
                if (matched.size() >= 5)
                    break;
            }
        }
        return matched;
    }

    private List<String> extractMatchedProducts(List<Product> products, String userQuery) {
        List<String> matched = new ArrayList<>();
        String lower = userQuery.toLowerCase(Locale.ROOT);
        for (Product p : products) {
            if (lower.contains(p.getName().toLowerCase(Locale.ROOT))) {
                matched.add(p.getName() + " - " + String.format("%,.0f VND/%s", p.getPrice(), p.getUnit()));
                if (matched.size() >= 5)
                    break;
            }
        }
        return matched;
    }
}