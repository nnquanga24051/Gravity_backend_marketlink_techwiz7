package com.gravity.marketlink.modules.product.repository;

import com.gravity.marketlink.modules.product.entity.FarmerCutoffSetting;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FarmerCutoffSettingRepository extends R2dbcRepository<FarmerCutoffSetting, Long> {
    Flux<FarmerCutoffSetting> findByFarmerId(Long farmerId);
    Mono<FarmerCutoffSetting> findByFarmerIdAndMarketIdAndDayOfWeek(Long farmerId, Long marketId, Integer dayOfWeek);
}
