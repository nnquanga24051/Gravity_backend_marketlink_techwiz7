package com.gravity.marketlink.modules.order.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.order.dto.PickupSlotRequest;
import com.gravity.marketlink.modules.order.dto.PickupSlotResponse;
import com.gravity.marketlink.modules.order.entity.PickupTimeSlot;
import com.gravity.marketlink.modules.order.repository.PickupTimeSlotRepository;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class PickupSlotService {

    private final PickupTimeSlotRepository slotRepository;
    private final MarketRepository marketRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    public Flux<PickupSlotResponse> getSlotsByMarket(Long marketId, Long farmerId) {
        Flux<PickupTimeSlot> slotFlux = (farmerId != null)
                ? slotRepository.findByFarmerIdAndMarketId(farmerId, marketId)
                : slotRepository.findByMarketId(marketId);

        return slotFlux.flatMap(this::enrichSlotResponse);
    }

    public Flux<PickupSlotResponse> getSlotsByFarmer(Long farmerId) {
        return slotRepository.findByFarmerId(farmerId)
                .flatMap(this::enrichSlotResponse);
    }

    @Transactional
    public Mono<PickupSlotResponse> createSlot(Long farmerId, PickupSlotRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().equals(request.getEndTime())) {
            return Mono.error(new IllegalArgumentException("Pickup slot start time must be before end time."));
        }

        return farmerProfileRepository.findById(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer profile not found with ID: " + farmerId)))
                .flatMap(profile -> {
                    if (profile.getIsApproved() == null || !profile.getIsApproved()) {
                        return Mono.error(new IllegalStateException("Farmer profile has not been KYC approved, cannot create pickup slots."));
                    }

                    return marketRepository.findById(request.getMarketId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmers market not found with ID: " + request.getMarketId())))
                            .flatMap(market -> {
                                PickupTimeSlot slot = PickupTimeSlot.builder()
                                        .farmerId(farmerId)
                                        .marketId(request.getMarketId())
                                        .startTime(request.getStartTime())
                                        .endTime(request.getEndTime())
                                        .maxOrdersCapacity(request.getMaxOrdersCapacity() != null ? request.getMaxOrdersCapacity() : 10)
                                        .build();

                                return slotRepository.save(slot).flatMap(this::enrichSlotResponse);
                            });
                });
    }

    @Transactional
    public Mono<Void> deleteSlot(Long farmerId, Long slotId) {
        return slotRepository.findById(slotId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Pickup slot not found with ID: " + slotId)))
                .flatMap(slot -> {
                    if (!slot.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to delete this pickup slot."));
                    }
                    return slotRepository.delete(slot);
                });
    }

    private Mono<PickupSlotResponse> enrichSlotResponse(PickupTimeSlot slot) {
        Mono<Market> marketMono = marketRepository.findById(slot.getMarketId())
                .defaultIfEmpty(Market.builder().name("Market #" + slot.getMarketId()).build());

        Mono<FarmerProfile> profileMono = farmerProfileRepository.findById(slot.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Farmer Stall #" + slot.getFarmerId()).build());

        Mono<User> userMono = userRepository.findById(slot.getFarmerId())
                .defaultIfEmpty(User.builder().fullName("Farmer #" + slot.getFarmerId()).build());

        return Mono.zip(marketMono, profileMono, userMono)
                .map(tuple -> {
                    Market market = tuple.getT1();
                    FarmerProfile profile = tuple.getT2();
                    User user = tuple.getT3();

                    String timeRange = slot.getStartTime().format(TIME_FMT) + " - " + slot.getEndTime().format(TIME_FMT);

                    return PickupSlotResponse.builder()
                            .slotId(slot.getSlotId())
                            .farmerId(slot.getFarmerId())
                            .farmerName(user.getFullName())
                            .stallName(profile.getStallName())
                            .marketId(slot.getMarketId())
                            .marketName(market.getName())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .maxOrdersCapacity(slot.getMaxOrdersCapacity())
                            .timeRange(timeRange)
                            .build();
                });
    }
}
