package com.gravity.marketlink.modules.market.repository;

import com.gravity.marketlink.modules.market.entity.Market;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface MarketRepository extends R2dbcRepository<Market, Long> {
    Flux<Market> findByIsActiveTrue();
}
