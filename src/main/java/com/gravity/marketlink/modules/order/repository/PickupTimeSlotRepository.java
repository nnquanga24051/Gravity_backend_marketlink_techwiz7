package com.gravity.marketlink.modules.order.repository;

import com.gravity.marketlink.modules.order.entity.PickupTimeSlot;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface PickupTimeSlotRepository extends R2dbcRepository<PickupTimeSlot, Long> {
    Flux<PickupTimeSlot> findByMarketId(Long marketId);
}
