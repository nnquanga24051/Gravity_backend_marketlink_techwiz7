package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface FarmerProfileRepository extends R2dbcRepository<FarmerProfile, Long> {
    Mono<FarmerProfile> findByFarmerId(Long farmerId);
}
