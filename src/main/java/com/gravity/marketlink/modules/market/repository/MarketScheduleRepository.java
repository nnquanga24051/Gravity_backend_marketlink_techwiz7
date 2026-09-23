package com.gravity.marketlink.modules.market.repository;

import com.gravity.marketlink.modules.market.entity.MarketSchedule;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface MarketScheduleRepository extends R2dbcRepository<MarketSchedule, Long> {
    Flux<MarketSchedule> findByMarketId(Long marketId);
    Flux<MarketSchedule> findByMarketIdAndDayOfWeek(Long marketId, Integer dayOfWeek);
}
