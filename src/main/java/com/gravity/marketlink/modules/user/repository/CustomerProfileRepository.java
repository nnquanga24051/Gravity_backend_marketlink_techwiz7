package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface CustomerProfileRepository extends R2dbcRepository<CustomerProfile, Long> {
    Mono<CustomerProfile> findByCustomerId(Long customerId);

    @Modifying
    @Query("UPDATE customer_profiles SET default_address = :defaultAddress, latitude = :latitude, longitude = :longitude, updated_at = :updatedAt WHERE customer_id = :customerId")
    Mono<Integer> updateCustomerProfile(Long customerId, String defaultAddress, BigDecimal latitude, BigDecimal longitude, LocalDateTime updatedAt);

    Flux<CustomerProfile> findByFamilyAccountId(Long familyAccountId);

    @Modifying
    @Query("UPDATE customer_profiles SET family_account_id = :familyAccountId, updated_at = :updatedAt WHERE customer_id = :customerId")
    Mono<Integer> updateFamilyAccountId(Long customerId, Long familyAccountId, LocalDateTime updatedAt);

    @Modifying
    @Query("UPDATE customer_profiles SET family_account_id = NULL, updated_at = :updatedAt WHERE customer_id = :customerId")
    Mono<Integer> clearFamilyAccountId(Long customerId, LocalDateTime updatedAt);
}
