package com.gravity.marketlink.modules.product.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateRequest;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateResponse;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.entity.WeeklyStockTemplate;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import com.gravity.marketlink.modules.product.repository.WeeklyStockTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockTemplateService {

    private final WeeklyStockTemplateRepository templateRepository;
    private final ProductRepository productRepository;
    private final MarketRepository marketRepository;

    public Flux<WeeklyStockTemplateResponse> getTemplates(Long farmerId, Long marketId, String keyword) {
        Flux<WeeklyStockTemplate> templateFlux = (marketId != null)
                ? templateRepository.findByFarmerIdAndMarketId(farmerId, marketId)
                : templateRepository.findByFarmerId(farmerId);

        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";

        return templateFlux.flatMap(this::enrichTemplateResponse)
                .filter(t -> kw.isEmpty()
                        || (t.getProductName() != null && t.getProductName().toLowerCase().contains(kw))
                        || (t.getMarketName() != null && t.getMarketName().toLowerCase().contains(kw)));
    }

    public Flux<WeeklyStockTemplateResponse> getTemplates(Long farmerId, Long marketId) {
        return getTemplates(farmerId, marketId, null);
    }

    @Transactional
    public Mono<WeeklyStockTemplateResponse> saveTemplate(Long farmerId, WeeklyStockTemplateRequest request) {
        return productRepository.findById(request.getProductId())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + request.getProductId())))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("This product does not belong to your stall."));
                    }

                    return marketRepository.findById(request.getMarketId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmers market not found with ID: " + request.getMarketId())))
                            .flatMap(market -> templateRepository.findByFarmerIdAndMarketIdAndProductIdAndDayOfWeek(
                                            farmerId, request.getMarketId(), request.getProductId(), request.getDayOfWeek())
                                    .flatMap(existing -> {
                                        existing.setRecurringQuantity(request.getRecurringQuantity());
                                        existing.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
                                        return templateRepository.save(existing);
                                    })
                                    .switchIfEmpty(templateRepository.save(WeeklyStockTemplate.builder()
                                            .farmerId(farmerId)
                                            .productId(request.getProductId())
                                            .marketId(request.getMarketId())
                                            .dayOfWeek(request.getDayOfWeek())
                                            .recurringQuantity(request.getRecurringQuantity())
                                            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                                            .build()))
                                    .flatMap(this::enrichTemplateResponse));
                });
    }

    @Transactional
    public Mono<Void> deleteTemplate(Long farmerId, Long templateId) {
        return templateRepository.findById(templateId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Stock template not found with ID: " + templateId)))
                .flatMap(tpl -> {
                    if (!tpl.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to delete this stock template."));
                    }
                    return templateRepository.delete(tpl);
                });
    }

    private Mono<WeeklyStockTemplateResponse> enrichTemplateResponse(WeeklyStockTemplate tpl) {
        Mono<Product> productMono = productRepository.findById(tpl.getProductId())
                .defaultIfEmpty(Product.builder().name("Produce #" + tpl.getProductId()).build());

        Mono<Market> marketMono = marketRepository.findById(tpl.getMarketId())
                .defaultIfEmpty(Market.builder().name("Market #" + tpl.getMarketId()).build());

        return Mono.zip(productMono, marketMono)
                .map(tuple -> {
                    Product prod = tuple.getT1();
                    Market mkt = tuple.getT2();

                    return WeeklyStockTemplateResponse.builder()
                            .templateId(tpl.getTemplateId())
                            .farmerId(tpl.getFarmerId())
                            .productId(tpl.getProductId())
                            .productName(prod.getName())
                            .productUnit(prod.getUnit())
                            .productPrice(prod.getPrice())
                            .marketId(tpl.getMarketId())
                            .marketName(mkt.getName())
                            .dayOfWeek(tpl.getDayOfWeek())
                            .recurringQuantity(tpl.getRecurringQuantity())
                            .isActive(tpl.getIsActive())
                            .build();
                });
    }
}
