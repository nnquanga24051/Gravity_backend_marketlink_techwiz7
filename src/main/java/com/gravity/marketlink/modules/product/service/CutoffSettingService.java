package com.gravity.marketlink.modules.product.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingRequest;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingResponse;
import com.gravity.marketlink.modules.product.entity.FarmerCutoffSetting;
import com.gravity.marketlink.modules.product.repository.FarmerCutoffSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class CutoffSettingService {

    private final FarmerCutoffSettingRepository cutoffRepository;
    private final MarketRepository marketRepository;

    public Flux<FarmerCutoffSettingResponse> getSettings(Long farmerId) {
        return cutoffRepository.findByFarmerId(farmerId)
                .flatMap(setting -> marketRepository.findById(setting.getMarketId())
                        .defaultIfEmpty(Market.builder().name("Market #" + setting.getMarketId()).build())
                        .map(market -> FarmerCutoffSettingResponse.builder()
                                .settingId(setting.getSettingId())
                                .farmerId(setting.getFarmerId())
                                .marketId(setting.getMarketId())
                                .marketName(market.getName())
                                .dayOfWeek(setting.getDayOfWeek())
                                .cutoffHoursBefore(setting.getCutoffHoursBefore())
                                .build()));
    }

    @Transactional
    public Mono<FarmerCutoffSettingResponse> saveSetting(Long farmerId, FarmerCutoffSettingRequest request) {
        return marketRepository.findById(request.getMarketId())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmers market not found with ID: " + request.getMarketId())))
                .flatMap(market -> cutoffRepository.findByFarmerIdAndMarketIdAndDayOfWeek(
                                farmerId, request.getMarketId(), request.getDayOfWeek())
                        .flatMap(existing -> {
                            existing.setCutoffHoursBefore(request.getCutoffHoursBefore());
                            return cutoffRepository.save(existing);
                        })
                        .switchIfEmpty(cutoffRepository.save(FarmerCutoffSetting.builder()
                                .farmerId(farmerId)
                                .marketId(request.getMarketId())
                                .dayOfWeek(request.getDayOfWeek())
                                .cutoffHoursBefore(request.getCutoffHoursBefore())
                                .build()))
                        .map(saved -> FarmerCutoffSettingResponse.builder()
                                .settingId(saved.getSettingId())
                                .farmerId(saved.getFarmerId())
                                .marketId(saved.getMarketId())
                                .marketName(market.getName())
                                .dayOfWeek(saved.getDayOfWeek())
                                .cutoffHoursBefore(saved.getCutoffHoursBefore())
                                .build()));
    }

    @Transactional
    public Mono<Void> deleteSetting(Long farmerId, Long settingId) {
        return cutoffRepository.findById(settingId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Cutoff setting not found with ID: " + settingId)))
                .flatMap(setting -> {
                    if (!setting.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to delete this cutoff setting."));
                    }
                    return cutoffRepository.delete(setting);
                });
    }
}
