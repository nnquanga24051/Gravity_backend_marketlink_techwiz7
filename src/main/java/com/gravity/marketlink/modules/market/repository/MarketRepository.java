package com.gravity.marketlink.modules.market.repository;

import com.gravity.marketlink.modules.market.entity.Market;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface MarketRepository extends R2dbcRepository<Market, Long> {
       Flux<Market> findByStatus(String status);

       @Query("SELECT DISTINCT m.* FROM markets m " +
                     "INNER JOIN market_schedules ms ON m.market_id = ms.market_id " +
                     "WHERE m.status = 'ACTIVE' AND ms.day_of_week = :dayOfWeek")
       Flux<Market> findActiveMarketsByDayOfWeek(Integer dayOfWeek);
}
