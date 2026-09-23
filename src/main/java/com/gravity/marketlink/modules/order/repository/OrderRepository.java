package com.gravity.marketlink.modules.order.repository;

import com.gravity.marketlink.modules.order.entity.Order;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Repository
public interface OrderRepository extends R2dbcRepository<Order, Long> {
    Mono<Order> findByOrderCode(String orderCode);
    Flux<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Flux<Order> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    Flux<Order> findByFarmerIdAndMarketIdAndPickupDate(Long farmerId, Long marketId, LocalDate pickupDate);
    Flux<Order> findByFarmerIdAndOrderStatus(Long farmerId, String orderStatus);
}
