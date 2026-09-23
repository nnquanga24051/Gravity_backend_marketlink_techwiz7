package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface CustomerProfileRepository extends R2dbcRepository<CustomerProfile, Long> {
    Mono<CustomerProfile> findByCustomerId(Long customerId);
}
