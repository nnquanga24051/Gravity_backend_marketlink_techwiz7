package com.gravity.marketlink.modules.market.service;

import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.market.dto.AdminAssignStallRequest;
import com.gravity.marketlink.modules.market.dto.FarmerAtMarketResponse;
import com.gravity.marketlink.modules.market.dto.FarmerRegisterMarketRequest;
import com.gravity.marketlink.modules.market.dto.MarketDetailResponse;
import com.gravity.marketlink.modules.market.dto.MarketRequest;
import com.gravity.marketlink.modules.market.dto.MarketScheduleDto;
import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.entity.MarketSchedule;
import com.gravity.marketlink.modules.market.repository.FarmerMarketAssignmentRepository;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.market.repository.MarketScheduleRepository;
import com.gravity.marketlink.modules.notification.service.NotificationService;
import com.gravity.marketlink.modules.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketService {

    private final MarketRepository marketRepository;
    private final MarketScheduleRepository marketScheduleRepository;
    private final FarmerMarketAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final TransactionalOperator transactionalOperator;
    private final NotificationService notificationService;

    /**
     * 1. Retrieves all active markets (including coordinates for Map Pin, keyword search, city & schedule filtering)
     */
    public Flux<Market> getAllActiveMarkets(String search, String city, Integer dayOfWeek) {
        Flux<Market> marketFlux;
        if (dayOfWeek != null && dayOfWeek >= 1 && dayOfWeek <= 7) {
            marketFlux = marketRepository.findActiveMarketsByDayOfWeek(dayOfWeek);
        } else {
            marketFlux = marketRepository.findByStatus("ACTIVE");
        }

        if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city)) {
            String c = city.trim().toLowerCase();
            marketFlux = marketFlux.filter(m ->
                    (m.getAddress() != null && m.getAddress().toLowerCase().contains(c)) ||
                    (m.getName() != null && m.getName().toLowerCase().contains(c))
            );
        }

        if (search != null && !search.isBlank()) {
            String query = search.trim().toLowerCase();
            marketFlux = marketFlux.filter(m ->
                    (m.getName() != null && m.getName().toLowerCase().contains(query)) ||
                    (m.getAddress() != null && m.getAddress().toLowerCase().contains(query)) ||
                    (m.getDescription() != null && m.getDescription().toLowerCase().contains(query))
            );
        }

        return marketFlux;
    }

    public Flux<Market> getAllActiveMarkets() {
        return getAllActiveMarkets(null, null, null);
    }

    /**
     * Retrieves all farmer stalls across the platform or by market with keyword search
     */
    public Flux<FarmerAtMarketResponse> getAllStalls(String search, Long marketId) {
        Flux<FarmerAtMarketResponse> flux = (marketId != null)
                ? assignmentRepository.findActiveFarmersByMarketId(marketId)
                : assignmentRepository.findAllActiveStalls();

        if (search != null && !search.isBlank()) {
            String query = search.trim().toLowerCase();
            flux = flux.filter(s ->
                    (s.getStallName() != null && s.getStallName().toLowerCase().contains(query)) ||
                    (s.getFarmerName() != null && s.getFarmerName().toLowerCase().contains(query)) ||
                    (s.getBio() != null && s.getBio().toLowerCase().contains(query)) ||
                    (s.getFarmAddress() != null && s.getFarmAddress().toLowerCase().contains(query)) ||
                    (s.getStallNumber() != null && s.getStallNumber().toLowerCase().contains(query))
            );
        }

        return flux;
    }

    /**
     * 2. Retrieves detailed market information (including recurring schedule & stall count)
     */
    public Mono<MarketDetailResponse> getMarketDetail(Long marketId) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + marketId)))
                .flatMap(market ->
                        marketScheduleRepository.findByMarketId(marketId)
                                .map(this::toScheduleDto)
                                .collectList()
                                .flatMap(schedules ->
                                        assignmentRepository.countByMarketIdAndStatus(marketId, "ACTIVE")
                                                .defaultIfEmpty(0L)
                                                .map(farmersCount -> MarketDetailResponse.builder()
                                                        .marketId(market.getMarketId())
                                                        .name(market.getName())
                                                        .address(market.getAddress())
                                                        .latitude(market.getLatitude())
                                                        .longitude(market.getLongitude())
                                                        .description(market.getDescription())
                                                        .imageUrl(market.getImageUrl())
                                                        .status(market.getStatus())
                                                        .schedules(schedules)
                                                        .activeFarmersCount(farmersCount)
                                                        .createdAt(market.getCreatedAt())
                                                        .build()
                                                )
                                )
                );
    }

    /**
     * 3. Customer filters markets by operating day of the week (1: Monday, ..., 7: Sunday)
     */
    public Flux<Market> getMarketsByDayOfWeek(Integer dayOfWeek) {
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            return Flux.error(new IllegalArgumentException("Day of week must be between 1 (Monday) and 7 (Sunday)"));
        }
        return marketRepository.findActiveMarketsByDayOfWeek(dayOfWeek);
    }

    /**
     * 4. View list of farmer stalls operating at a specific market
     */
    public Flux<FarmerAtMarketResponse> getFarmersAtMarket(Long marketId) {
        return assignmentRepository.findActiveFarmersByMarketId(marketId);
    }

    /**
     * 5. Farmer registers for market participation
     */
    public Mono<FarmerMarketAssignment> farmerRegisterMarket(String farmerEmail, FarmerRegisterMarketRequest request) {
        return userRepository.findByEmail(farmerEmail)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmer profile not found: " + farmerEmail)))
                .flatMap(user -> marketRepository.findById(request.getMarketId())
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market does not exist: " + request.getMarketId())))
                        .flatMap(market -> {
                            if (!"ACTIVE".equalsIgnoreCase(market.getStatus())) {
                                return Mono.error(new IllegalArgumentException("Market is currently inactive"));
                            }

                            Mono<FarmerMarketAssignment> saveMono = assignmentRepository.findByFarmerIdAndMarketId(user.getUserId(), request.getMarketId())
                                    .flatMap(existing -> {
                                        if ("ACTIVE".equalsIgnoreCase(existing.getStatus()) || "REGISTERED".equalsIgnoreCase(existing.getStatus())) {
                                            return Mono.<FarmerMarketAssignment>error(new IllegalArgumentException("You have already registered for this market (Status: " + existing.getStatus() + ")"));
                                        }
                                        existing.setStatus("REGISTERED");
                                        existing.setStallNumber(request.getStallNumber());
                                        return assignmentRepository.save(existing);
                                    })
                                    .switchIfEmpty(
                                            assignmentRepository.save(FarmerMarketAssignment.builder()
                                                    .farmerId(user.getUserId())
                                                    .marketId(request.getMarketId())
                                                    .stallNumber(request.getStallNumber() != null ? request.getStallNumber() : "Pending stall assignment")
                                                    .status("REGISTERED")
                                                    .createdAt(LocalDateTime.now())
                                                    .build())
                                    );

                            return saveMono.flatMap(assignment -> {
                                String farmerName = (user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName() : user.getEmail();
                                String notifTitle = "New Market Stall Registration";
                                String notifMsg = String.format("Farmer %s has registered for market '%s'. Please review and assign a stall.",
                                        farmerName, market.getName());
                                return notificationService.notifyAdmins(notifTitle, notifMsg, "SYSTEM", market.getMarketId())
                                        .thenReturn(assignment);
                            });
                        })
                );
    }

    /**
     * 6. Farmer views list of registered markets
     */
    public Flux<FarmerMarketAssignment> getMyMarketAssignments(String farmerEmail) {
        return userRepository.findByEmail(farmerEmail)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmer not found")))
                .flatMapMany(user -> assignmentRepository.findByFarmerId(user.getUserId()))
                .flatMap(assignment -> marketRepository.findById(assignment.getMarketId())
                        .map(market -> {
                            assignment.setMarketName(market.getName());
                            assignment.setMarketAddress(market.getAddress());
                            return assignment;
                        })
                        .defaultIfEmpty(assignment)
                );
    }

    // ===================================================================
    // ADMIN MANAGEMENT FUNCTIONS
    // ===================================================================

    /**
     * Admin creates new market location with recurring schedule
     */
    public Mono<MarketDetailResponse> createMarket(MarketRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Market newMarket = Market.builder()
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        return marketRepository.save(newMarket)
                .flatMap(savedMarket -> {
                    if (request.getSchedules() == null || request.getSchedules().isEmpty()) {
                        return getMarketDetail(savedMarket.getMarketId());
                    }

                    List<MarketSchedule> schedules = request.getSchedules().stream()
                            .map(dto -> MarketSchedule.builder()
                                    .marketId(savedMarket.getMarketId())
                                    .dayOfWeek(dto.getDayOfWeek())
                                    .openTime(dto.getOpenTime())
                                    .closeTime(dto.getCloseTime())
                                    .build())
                            .toList();

                    return marketScheduleRepository.saveAll(schedules)
                            .then(getMarketDetail(savedMarket.getMarketId()));
                })
                .as(transactionalOperator::transactional);
    }

    /**
     * Admin updates market details and schedule
     */
    public Mono<MarketDetailResponse> updateMarket(Long marketId, MarketRequest request) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + marketId)))
                .flatMap(market -> {
                    market.setName(request.getName());
                    market.setAddress(request.getAddress());
                    market.setLatitude(request.getLatitude());
                    market.setLongitude(request.getLongitude());
                    market.setDescription(request.getDescription());
                    market.setImageUrl(request.getImageUrl());
                    if (request.getStatus() != null) {
                        market.setStatus(request.getStatus());
                    }
                    market.setUpdatedAt(LocalDateTime.now());

                    return marketRepository.save(market)
                            .flatMap(savedMarket -> {
                                if (request.getSchedules() == null) {
                                    return getMarketDetail(savedMarket.getMarketId());
                                }

                                return marketScheduleRepository.deleteByMarketId(savedMarket.getMarketId())
                                        .thenMany(Flux.fromIterable(request.getSchedules())
                                                .map(dto -> MarketSchedule.builder()
                                                        .marketId(savedMarket.getMarketId())
                                                        .dayOfWeek(dto.getDayOfWeek())
                                                        .openTime(dto.getOpenTime())
                                                        .closeTime(dto.getCloseTime())
                                                        .build()))
                                        .flatMap(marketScheduleRepository::save)
                                        .then(getMarketDetail(savedMarket.getMarketId()));
                            });
                })
                .as(transactionalOperator::transactional);
    }

    /**
     * Admin changes market status (Soft delete or Deactivate)
     */
    /**
     * Admin retrieves all markets (with status filter and search)
     */
    public Flux<MarketDetailResponse> getAllMarketsForAdmin(String status, String search) {
        Flux<Market> marketFlux;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            marketFlux = marketRepository.findByStatus(status.toUpperCase());
        } else {
            marketFlux = marketRepository.findAll();
        }

        if (search != null && !search.isBlank()) {
            String query = search.toLowerCase().trim();
            marketFlux = marketFlux.filter(m ->
                    (m.getName() != null && m.getName().toLowerCase().contains(query)) ||
                    (m.getAddress() != null && m.getAddress().toLowerCase().contains(query))
            );
        }

        return marketFlux
                .sort((m1, m2) -> Long.compare(m2.getMarketId(), m1.getMarketId()))
                .flatMap(market -> getMarketDetail(market.getMarketId()));
    }

    /**
     * Admin toggles active status of market (ACTIVE / INACTIVE)
     */
    public Mono<MarketDetailResponse> updateMarketStatus(Long marketId, String status) {
        String upper = status != null ? status.toUpperCase() : "ACTIVE";
        if (!upper.equals("ACTIVE") && !upper.equals("INACTIVE")) {
            return Mono.error(new IllegalArgumentException("Market status only accepts ACTIVE or INACTIVE"));
        }

        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + marketId)))
                .flatMap(market -> {
                    market.setStatus(upper);
                    market.setUpdatedAt(LocalDateTime.now());
                    return marketRepository.save(market)
                            .then(getMarketDetail(marketId));
                });
    }

    /**
     * Admin soft-deletes (deactivates) a market
     */
    public Mono<Map<String, Object>> deleteMarket(Long marketId) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + marketId)))
                .flatMap(market -> {
                    market.setStatus("INACTIVE");
                    market.setUpdatedAt(LocalDateTime.now());
                    return marketRepository.save(market)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Paused farmers market operations: " + market.getName()
                            ));
                });
    }

    /**
     * Admin permanently deletes market (with order integrity checks)
     */
    public Mono<Map<String, Object>> deleteMarketPermanently(Long marketId) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + marketId)))
                .flatMap(market ->
                        orderRepository.countByMarketId(marketId)
                                .defaultIfEmpty(0L)
                                .flatMap(orderCount -> {
                                    if (orderCount > 0) {
                                        return Mono.error(new IllegalStateException(
                                                "Cannot permanently delete market '" + market.getName() +
                                                "' because there are " + orderCount + " associated orders. Please use the 'Pause' (soft delete) feature instead."
                                        ));
                                    }

                                    return marketScheduleRepository.deleteByMarketId(marketId)
                                            .then(assignmentRepository.deleteByMarketId(marketId))
                                            .then(marketRepository.deleteById(marketId))
                                            .thenReturn(Map.<String, Object>of(
                                                    "status", "SUCCESS",
                                                    "message", "Permanently deleted farmers market '" + market.getName() + "' along with all associated schedules and stall assignments."
                                            ));
                                })
                )
                .as(transactionalOperator::transactional);
    }

    /**
     * Admin assigns stall to farmer
     */
    public Mono<FarmerMarketAssignment> adminAssignStall(AdminAssignStallRequest request) {
        return userRepository.findById(request.getFarmerId())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmer account not found with ID: " + request.getFarmerId())))
                .flatMap(farmer -> marketRepository.findById(request.getMarketId())
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Farmers market not found with ID: " + request.getMarketId())))
                        .flatMap(market -> {
                            String targetStatus = request.getStatus() != null && !request.getStatus().isBlank()
                                    ? request.getStatus().toUpperCase()
                                    : "ACTIVE";

                            Mono<FarmerMarketAssignment> saveMono = assignmentRepository.findByFarmerIdAndMarketId(farmer.getUserId(), market.getMarketId())
                                    .flatMap(existing -> {
                                        existing.setStallNumber(request.getStallNumber());
                                        existing.setStatus(targetStatus);
                                        return assignmentRepository.save(existing);
                                    })
                                    .switchIfEmpty(
                                            assignmentRepository.save(FarmerMarketAssignment.builder()
                                                    .farmerId(farmer.getUserId())
                                                    .marketId(market.getMarketId())
                                                    .stallNumber(request.getStallNumber())
                                                    .status(targetStatus)
                                                    .createdAt(LocalDateTime.now())
                                                    .build())
                                    );

                            return saveMono.flatMap(assignment -> {
                                String notifTitle = "Market Stall Assigned 🎉";
                                String notifMsg = String.format("You have been assigned stall '%s' at market '%s' (Status: %s).",
                                        request.getStallNumber(), market.getName(), targetStatus);
                                return notificationService.createNotification(farmer.getUserId(), notifTitle, notifMsg, "SYSTEM", market.getMarketId())
                                        .thenReturn(assignment);
                            });
                        })
                );
    }

    /**
     * Admin views all farmer stalls at market (all statuses)
     */
    public Flux<FarmerAtMarketResponse> getMarketAssignmentsForAdmin(Long marketId) {
        return assignmentRepository.findAllFarmersByMarketId(marketId);
    }

    /**
     * Admin cancels / deletes stall assignment
     */
    public Mono<Map<String, Object>> deleteAssignment(Long assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Stall assignment not found with ID: " + assignmentId)))
                .flatMap(assignment -> assignmentRepository.deleteById(assignmentId)
                        .thenReturn(Map.<String, Object>of(
                                "status", "SUCCESS",
                                "message", "Deleted stall assignment number: " + assignment.getStallNumber()
                        )));
    }

    /**
     * Admin approves or revokes farmer stall (ACTIVE, REVOKED, REGISTERED)
     */
    public Mono<Map<String, Object>> updateAssignmentStatus(Long assignmentId, String status) {
        String upperStatus = status.toUpperCase();
        if (!upperStatus.equals("ACTIVE") && !upperStatus.equals("REVOKED") && !upperStatus.equals("REGISTERED")) {
            return Mono.error(new IllegalArgumentException("Invalid status: only ACTIVE, REVOKED, or REGISTERED are supported"));
        }

        return assignmentRepository.findById(assignmentId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Stall registration not found: " + assignmentId)))
                .flatMap(assignment -> {
                    assignment.setStatus(upperStatus);
                    return assignmentRepository.save(assignment)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Updated stall status to: " + upperStatus
                            ));
                });
    }

    private MarketScheduleDto toScheduleDto(MarketSchedule s) {
        return MarketScheduleDto.builder()
                .scheduleId(s.getScheduleId())
                .dayOfWeek(s.getDayOfWeek())
                .openTime(s.getOpenTime())
                .closeTime(s.getCloseTime())
                .build();
    }
}
