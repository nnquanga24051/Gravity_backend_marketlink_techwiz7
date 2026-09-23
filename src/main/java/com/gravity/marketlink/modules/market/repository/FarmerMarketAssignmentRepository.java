package com.gravity.marketlink.modules.market.repository;

import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FarmerMarketAssignmentRepository extends R2dbcRepository<FarmerMarketAssignment, Long> {
    Flux<FarmerMarketAssignment> findByMarketIdAndStatus(Long marketId, String status);
    Flux<FarmerMarketAssignment> findByFarmerIdAndStatus(Long farmerId, String status);
    Mono<FarmerMarketAssignment> findByFarmerIdAndMarketId(Long farmerId, Long marketId);
}
