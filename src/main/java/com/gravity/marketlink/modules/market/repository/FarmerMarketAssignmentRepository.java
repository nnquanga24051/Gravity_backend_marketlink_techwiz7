package com.gravity.marketlink.modules.market.repository;

import com.gravity.marketlink.modules.market.dto.FarmerAtMarketResponse;
import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FarmerMarketAssignmentRepository extends R2dbcRepository<FarmerMarketAssignment, Long> {
    Flux<FarmerMarketAssignment> findByMarketIdAndStatus(Long marketId, String status);
    Flux<FarmerMarketAssignment> findByFarmerIdAndStatus(Long farmerId, String status);
    Flux<FarmerMarketAssignment> findByFarmerId(Long farmerId);
    Mono<FarmerMarketAssignment> findByFarmerIdAndMarketId(Long farmerId, Long marketId);
    Mono<Long> countByMarketIdAndStatus(Long marketId, String status);

    @Query("SELECT fma.assignment_id, fma.farmer_id, fma.market_id, fma.stall_number, fma.status, " +
           "fp.stall_name, fp.bio, fp.farm_address, fp.latitude, fp.longitude, " +
           "u.full_name AS farmer_name, u.avatar_url, u.phone_number " +
           "FROM farmer_market_assignments fma " +
           "INNER JOIN farmer_profiles fp ON fma.farmer_id = fp.farmer_id " +
           "INNER JOIN users u ON fp.farmer_id = u.user_id " +
           "WHERE fma.market_id = :marketId AND fma.status = 'ACTIVE'")
    Flux<FarmerAtMarketResponse> findActiveFarmersByMarketId(Long marketId);

    Flux<FarmerMarketAssignment> findByMarketId(Long marketId);
    Mono<Void> deleteByMarketId(Long marketId);

    @Query("SELECT fma.assignment_id, fma.farmer_id, fma.market_id, fma.stall_number, fma.status, " +
           "fp.stall_name, fp.bio, fp.farm_address, fp.latitude, fp.longitude, " +
           "u.full_name AS farmer_name, u.avatar_url, u.phone_number " +
           "FROM farmer_market_assignments fma " +
           "LEFT JOIN farmer_profiles fp ON fma.farmer_id = fp.farmer_id " +
           "LEFT JOIN users u ON fma.farmer_id = u.user_id " +
           "WHERE fma.market_id = :marketId " +
           "ORDER BY fma.created_at DESC")
    Flux<FarmerAtMarketResponse> findAllFarmersByMarketId(Long marketId);

    @Modifying
    @Query("UPDATE farmer_market_assignments SET status = :status WHERE assignment_id = :assignmentId")
    Mono<Integer> updateAssignmentStatus(Long assignmentId, String status);
}
