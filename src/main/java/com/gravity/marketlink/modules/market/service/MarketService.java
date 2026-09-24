package com.gravity.marketlink.modules.market.service;

import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
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
    private final TransactionalOperator transactionalOperator;

    /**
     * 1. Lấy danh sách tất cả các điểm chợ đang hoạt động (kèm tọa độ để vẽ Map Pin)
     */
    public Flux<Market> getAllActiveMarkets() {
        return marketRepository.findByStatus("ACTIVE");
    }

    /**
     * 2. Lấy thông tin chi tiết một chợ (kèm lịch họp chợ định kỳ & số lượng sạp)
     */
    public Mono<MarketDetailResponse> getMarketDetail(Long marketId) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy chợ nông sản với ID: " + marketId)))
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
     * 3. Khách hàng lọc chợ theo ngày họp chợ trong tuần (1: Thứ 2, ..., 7: Chủ nhật)
     */
    public Flux<Market> getMarketsByDayOfWeek(Integer dayOfWeek) {
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            return Flux.error(new IllegalArgumentException("Ngày trong tuần phải từ 1 (Thứ 2) đến 7 (Chủ nhật)"));
        }
        return marketRepository.findActiveMarketsByDayOfWeek(dayOfWeek);
    }

    /**
     * 4. Xem danh sách các sạp nông dân đang bán tại chợ cụ thể
     */
    public Flux<FarmerAtMarketResponse> getFarmersAtMarket(Long marketId) {
        return assignmentRepository.findActiveFarmersByMarketId(marketId);
    }

    /**
     * 5. Nông dân đăng ký tham gia bán hàng tại chợ
     */
    public Mono<FarmerMarketAssignment> farmerRegisterMarket(String farmerEmail, FarmerRegisterMarketRequest request) {
        return userRepository.findByEmail(farmerEmail)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy thông tin nông dân: " + farmerEmail)))
                .flatMap(user -> marketRepository.findById(request.getMarketId())
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Chợ nông sản không tồn tại: " + request.getMarketId())))
                        .flatMap(market -> {
                            if (!"ACTIVE".equalsIgnoreCase(market.getStatus())) {
                                return Mono.error(new IllegalArgumentException("Chợ hiện tại đang tạm ngưng hoạt động"));
                            }

                            return assignmentRepository.findByFarmerIdAndMarketId(user.getUserId(), request.getMarketId())
                                    .flatMap(existing -> {
                                        if ("ACTIVE".equalsIgnoreCase(existing.getStatus()) || "REGISTERED".equalsIgnoreCase(existing.getStatus())) {
                                            return Mono.<FarmerMarketAssignment>error(new IllegalArgumentException("Bạn đã đăng ký tham gia chợ này rồi (Trạng thái: " + existing.getStatus() + ")"));
                                        }
                                        existing.setStatus("REGISTERED");
                                        existing.setStallNumber(request.getStallNumber());
                                        return assignmentRepository.save(existing);
                                    })
                                    .switchIfEmpty(
                                            assignmentRepository.save(FarmerMarketAssignment.builder()
                                                    .farmerId(user.getUserId())
                                                    .marketId(request.getMarketId())
                                                    .stallNumber(request.getStallNumber() != null ? request.getStallNumber() : "Chờ phân sạp")
                                                    .status("REGISTERED")
                                                    .createdAt(LocalDateTime.now())
                                                    .build())
                                    );
                        })
                );
    }

    /**
     * 6. Nông dân xem danh sách các chợ mình đã đăng ký
     */
    public Flux<FarmerMarketAssignment> getMyMarketAssignments(String farmerEmail) {
        return userRepository.findByEmail(farmerEmail)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy nông dân")))
                .flatMapMany(user -> assignmentRepository.findByFarmerId(user.getUserId()));
    }

    // ===================================================================
    // CÁC CHỨC NĂNG DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)
    // ===================================================================

    /**
     * Admin tạo mới điểm chợ kèm lịch họp chợ
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
     * Admin cập nhật thông tin chợ và lịch họp chợ
     */
    public Mono<MarketDetailResponse> updateMarket(Long marketId, MarketRequest request) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy chợ nông sản với ID: " + marketId)))
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
     * Admin đổi trạng thái chợ (Xóa mềm hoặc Tạm ngưng hoạt động)
     */
    public Mono<Map<String, Object>> deleteMarket(Long marketId) {
        return marketRepository.findById(marketId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy chợ với ID: " + marketId)))
                .flatMap(market -> {
                    market.setStatus("INACTIVE");
                    market.setUpdatedAt(LocalDateTime.now());
                    return marketRepository.save(market)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Đã tạm dừng hoạt động chợ nông sản: " + market.getName()
                            ));
                });
    }

    /**
     * Admin duyệt hoặc thu hồi sạp chợ của nông dân (ACTIVE, REVOKED)
     */
    public Mono<Map<String, Object>> updateAssignmentStatus(Long assignmentId, String status) {
        String upperStatus = status.toUpperCase();
        if (!upperStatus.equals("ACTIVE") && !upperStatus.equals("REVOKED") && !upperStatus.equals("REGISTERED")) {
            return Mono.error(new IllegalArgumentException("Trạng thái không hợp lệ: chỉ chấp nhận ACTIVE, REVOKED, hoặc REGISTERED"));
        }

        return assignmentRepository.findById(assignmentId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy đơn đăng ký sạp: " + assignmentId)))
                .flatMap(assignment -> {
                    assignment.setStatus(upperStatus);
                    return assignmentRepository.save(assignment)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Đã cập nhật trạng thái sạp thành: " + upperStatus
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
