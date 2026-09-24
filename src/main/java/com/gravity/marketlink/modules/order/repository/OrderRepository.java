package com.gravity.marketlink.modules.order.repository;

import com.gravity.marketlink.modules.order.entity.Order;
import org.springframework.data.r2dbc.repository.Query;
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
    Flux<Order> findByFarmerIdAndPickupDateOrderByCreatedAtDesc(Long farmerId, LocalDate pickupDate);
    Flux<Order> findByFarmerIdAndMarketIdAndPickupDate(Long farmerId, Long marketId, LocalDate pickupDate);
    Flux<Order> findByFarmerIdAndOrderStatusOrderByCreatedAtDesc(Long farmerId, String orderStatus);

    @Query("SELECT COUNT(*) FROM orders WHERE slot_id = :slotId AND pickup_date = :pickupDate AND order_status NOT IN ('CANCELLED', 'DECLINED')")
    Mono<Long> countActiveOrdersInSlot(Long slotId, LocalDate pickupDate);
}
