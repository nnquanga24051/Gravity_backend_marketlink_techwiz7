package com.gravity.marketlink.modules.product.repository;

import com.gravity.marketlink.modules.product.entity.WeeklyStockTemplate;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface WeeklyStockTemplateRepository extends R2dbcRepository<WeeklyStockTemplate, Long> {
    Flux<WeeklyStockTemplate> findByFarmerIdAndMarketId(Long farmerId, Long marketId);
    Flux<WeeklyStockTemplate> findByFarmerIdAndMarketIdAndDayOfWeek(Long farmerId, Long marketId, Integer dayOfWeek);
    Mono<WeeklyStockTemplate> findByFarmerIdAndMarketIdAndProductIdAndDayOfWeek(Long farmerId, Long marketId, Long productId, Integer dayOfWeek);
}
