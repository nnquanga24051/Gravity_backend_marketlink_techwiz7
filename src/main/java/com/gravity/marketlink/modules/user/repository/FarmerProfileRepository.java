package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface FarmerProfileRepository extends R2dbcRepository<FarmerProfile, Long> {
    Mono<FarmerProfile> findByFarmerId(Long farmerId);

    @Modifying
    @Query("UPDATE farmer_profiles SET stall_name = :stallName, bio = :bio, farm_address = :farmAddress, latitude = :latitude, longitude = :longitude, updated_at = :updatedAt WHERE farmer_id = :farmerId")
    Mono<Integer> updateFarmerProfile(Long farmerId, String stallName, String bio, String farmAddress, BigDecimal latitude, BigDecimal longitude, LocalDateTime updatedAt);
}
