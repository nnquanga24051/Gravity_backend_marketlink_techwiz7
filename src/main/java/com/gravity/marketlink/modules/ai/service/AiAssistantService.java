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

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${ai.gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String geminiApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebClient webClient = WebClient.builder().build();

    public Mono<AiChatResponse> answerQuery(AiChatRequest request) {
        String msg = (request.getMessage() != null ? request.getMessage() : "").toLowerCase(Locale.ROOT).trim();

        // 1. Lấy dữ liệu chợ, lịch họp và sản phẩm thực tế từ Database
        Mono<List<Market>> marketsMono = marketRepository.findAll().collectList();
        Mono<List<MarketSchedule>> schedulesMono = scheduleRepository.findAll().collectList();
        Mono<List<Product>> productsMono = productRepository.findByStatus("AVAILABLE").collectList();

        return Mono.zip(marketsMono, schedulesMono, productsMono)
                .flatMap(tuple -> {
                    List<Market> markets = tuple.getT1();
                    List<MarketSchedule> schedules = tuple.getT2();
                    List<Product> products = tuple.getT3();

                    List<String> matchedMarkets = new ArrayList<>();
                    List<String> matchedProducts = new ArrayList<>();
                    StringBuilder localAnswer = new StringBuilder();

                    // Xác định ngày trong tuần nếu có hỏi
                    Integer queryDay = resolveDayOfWeek(msg);

                    // 2. Tìm kiếm Chợ phù hợp
                    for (Market m : markets) {
                        if (msg.contains(m.getName().toLowerCase(Locale.ROOT)) || queryDay != null) {
                            boolean matchesDay = schedules.stream()
                                    .anyMatch(s -> s.getMarketId().equals(m.getMarketId()) && (queryDay == null || s.getDayOfWeek().equals(queryDay)));

                            if (matchesDay) {
                                matchedMarkets.add(m.getName() + " (" + m.getAddress() + ")");
                            }
                        }
                    }

                    // 3. Tìm kiếm Nông sản phù hợp
                    for (Product p : products) {
                        String pName = p.getName().toLowerCase(Locale.ROOT);
                        if (msg.contains(pName) || msg.contains(p.getUnit().toLowerCase(Locale.ROOT))
                                || (msg.contains("rau") && pName.contains("rau"))
                                || (msg.contains("cà") && pName.contains("cà"))
                                || (msg.contains("hoa quả") || msg.contains("trái cây"))) {
                            matchedProducts.add(p.getName() + " - " + String.format("%,.0f VNĐ/%s", p.getPrice(), p.getUnit()));
                        }
                    }

                    // 4. Xây dựng câu trả lời dự phòng (Fallback Rule-based)
                    if (!matchedProducts.isEmpty() && !matchedMarkets.isEmpty()) {
                        localAnswer.append("Dạ, trợ lý MarketLink tìm thấy nông sản bạn đang quan tâm tại các phiên chợ phù hợp:\n");
                        localAnswer.append("• Nông sản sẵn có: ").append(String.join(", ", matchedProducts)).append(".\n");
                        localAnswer.append("• Điểm chợ đang mở: ").append(String.join("; ", matchedMarkets)).append(".");
                    } else if (!matchedProducts.isEmpty()) {
                        localAnswer.append("Dạ, hệ thống có các mặt hàng tươi ngon đang mở đặt trước:\n");
                        localAnswer.append("• ").append(String.join("\n• ", matchedProducts)).append("\n");
                        localAnswer.append("Bạn có thể đặt trước và chọn ca nhận hàng tại sạp chợ gần nhất nhé!");
                    } else if (!matchedMarkets.isEmpty()) {
                        localAnswer.append("Dạ, các phiên chợ họp theo yêu cầu của bạn gồm:\n");
                        localAnswer.append("• ").append(String.join("\n• ", matchedMarkets)).append("\n");
                        localAnswer.append("Các gian hàng nông dân đều có khung giờ nhận hàng sáng/chiều thuận tiện.");
                    } else {
                        localAnswer.append("Chào bạn! Trợ lý ảo MarketLink luôn sẵn sàng hỗ trợ bạn tra cứu lịch họp chợ, sạp nông dân đang mở bán và thông tin nông sản tươi ngon. ");
                        localAnswer.append("Hiện tại toàn sàn có ").append(markets.size()).append(" điểm chợ nông sản và ").append(products.size()).append(" mặt hàng sạch sẵn sàng đặt trước.");
                    }

                    String fallbackReply = localAnswer.toString();

                    // 5. Xác định API Key sử dụng (ưu tiên key truyền từ request, fallback về key cấu hình server)
                    String effectiveKey = (request.getApiKey() != null && !request.getApiKey().isBlank())
                            ? request.getApiKey().trim()
                            : (serverApiKey != null ? serverApiKey.trim() : "");

                    // Nếu có API Key -> Gọi Google Gemini API theo mô hình RAG
                    if (!effectiveKey.isEmpty()) {
                        String prompt = buildPrompt(markets, schedules, products, request.getMessage());
                        return callGeminiApi(prompt, effectiveKey, fallbackReply)
                                .map(replyText -> AiChatResponse.builder()
                                        .reply(replyText)
                                        .relevantMarkets(matchedMarkets)
                                        .relevantProducts(matchedProducts)
                                        .timingNotes("Lưu ý: Bạn nên đặt trước ít nhất 12 giờ trước phiên chợ họp để nông dân kịp thu hoạch nông sản tươi nhất!")
                                        .build());
                    } else {
                        // Không có API Key -> Trả về câu trả lời phân tích thông minh nội bộ
                        return Mono.just(AiChatResponse.builder()
                                .reply(fallbackReply)
                                .relevantMarkets(matchedMarkets)
                                .relevantProducts(matchedProducts)
                                .timingNotes("Lưu ý: Bạn nên đặt trước ít nhất 12 giờ trước phiên chợ họp để nông dân kịp thu hoạch nông sản tươi nhất!")
                                .build());
                    }
                });
    }

    private String buildPrompt(List<Market> markets, List<MarketSchedule> schedules, List<Product> products, String userQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là Trợ lý ảo AI thông minh của sàn Nông sản MarketLink (nền tảng kết nối nông dân và khách hàng tại các phiên chợ nông sản).\n");
        sb.append("Nhiệm vụ: Trả lời câu hỏi của khách hàng bằng tiếng Việt một cách tự nhiên, lịch sự, ngắn gọn và chính xác dựa trên DỮ LIỆU THỰC TẾ của sàn dưới đây:\n\n");

        sb.append("--- DANH SÁCH CHỢ VÀ LỊCH HỌP ---\n");
        for (Market m : markets) {
            sb.append(String.format("• Chợ: %s - Địa chỉ: %s\n", m.getName(), m.getAddress()));
            List<MarketSchedule> mSchedules = schedules.stream()
                    .filter(s -> s.getMarketId().equals(m.getMarketId()))
                    .toList();
            for (MarketSchedule s : mSchedules) {
                String dayName = switch (s.getDayOfWeek()) {
                    case 1 -> "Thứ Hai";
                    case 2 -> "Thứ Ba";
                    case 3 -> "Thứ Tư";
                    case 4 -> "Thứ Năm";
                    case 5 -> "Thứ Sáu";
                    case 6 -> "Thứ Bảy";
                    case 7 -> "Chủ Nhật";
                    default -> "Ngày " + s.getDayOfWeek();
                };
                sb.append(String.format("   + Lịch: %s (%s - %s)\n", dayName, s.getOpenTime(), s.getCloseTime()));
            }
        }

        sb.append("\n--- MỘT SỐ NÔNG SẢN ĐANG SẴN CÓ ---\n");
        int count = 0;
        for (Product p : products) {
            String stockStr = p.getCurrentStock() != null ? p.getCurrentStock().stripTrailingZeros().toPlainString() : "Sẵn có";
            sb.append(String.format("• %s: %,.0f VNĐ/%s (Còn: %s)\n", p.getName(), p.getPrice(), p.getUnit(), stockStr));
            count++;
            if (count >= 20) break; // giới hạn 20 sản phẩm tiêu biểu cho prompt gọn
        }

        sb.append("\nQuy định mua hàng: Khách hàng đặt trước (Pre-order) và chọn khung giờ nhận hàng tại sạp chợ (Pickup slot). Thanh toán trực tiếp tại sạp khi nhận hàng (PAY_AT_PICKUP). Sàn không hỗ trợ giao hàng tận nhà (shipper).\n\n");
        sb.append("Câu hỏi của khách hàng: \"").append(userQuery).append("\"\n");
        sb.append("Câu trả lời trợ lý:");
        return sb.toString();
    }

    private Mono<String> callGeminiApi(String prompt, String apiKey, String fallbackReply) {
        String url = String.format("%s/%s:generateContent?key=%s", geminiApiUrl, geminiModel, apiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                )
                        )
                )
        );

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(12))
                .map(rawJson -> parseGeminiResponse(rawJson, fallbackReply))
                .onErrorResume(e -> {
                    log.warn("Gemini API call failed ({}), falling back to local engine", e.getMessage());
                    return Mono.just(fallbackReply);
                });
    }

    private String parseGeminiResponse(String rawJson, String fallback) {
        if (rawJson == null || rawJson.isBlank()) {
            return fallback;
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
        return fallback;
    }

    private Integer resolveDayOfWeek(String msg) {
        if (msg.contains("chủ nhật") || msg.contains("cn") || msg.contains("sunday")) return 7;
        if (msg.contains("thứ 2") || msg.contains("thứ hai") || msg.contains("monday")) return 1;
        if (msg.contains("thứ 3") || msg.contains("thứ ba") || msg.contains("tuesday")) return 2;
        if (msg.contains("thứ 4") || msg.contains("thứ tư") || msg.contains("wednesday")) return 3;
        if (msg.contains("thứ 5") || msg.contains("thứ năm") || msg.contains("thursday")) return 4;
        if (msg.contains("thứ 6") || msg.contains("thứ sáu") || msg.contains("friday")) return 5;
        if (msg.contains("thứ 7") || msg.contains("thứ bảy") || msg.contains("saturday")) return 6;
        return null;
    }
}
