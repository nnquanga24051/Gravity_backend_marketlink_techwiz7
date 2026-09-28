package com.gravity.marketlink.modules.order.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.order.dto.BestSellingProductDto;
import com.gravity.marketlink.modules.order.dto.OrderCreateRequest;
import com.gravity.marketlink.modules.order.dto.OrderDetailResponse;
import com.gravity.marketlink.modules.order.dto.OrderModifyRequest;
import com.gravity.marketlink.modules.order.dto.OrderStatusUpdateRequest;
import com.gravity.marketlink.modules.order.dto.OrderSummaryResponse;
import com.gravity.marketlink.modules.order.dto.ReorderRequest;
import com.gravity.marketlink.modules.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "5. Produce Pre-orders (Orders)", description = "APIs for creating pre-orders, pay-at-pickup, tracking, and updating order lifecycle")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. CUSTOMER ENDPOINTS
    // ==========================================

    @Operation(summary = "Customer creates pre-order", description = "Pre-order fresh produce before market session. Checks inventory, validates pickup quota, calculates cutoff, and notifies farmer.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/customer/orders")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> createOrder(
            Authentication authentication,
            @Valid @RequestBody OrderCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.createOrder(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Order placed successfully. See you at the market session!", created)));
    }

    @Operation(summary = "Customer views personal pre-order history", description = "Retrieves order history for logged-in user with keyword search and status filters.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getMyOrders(
            Authentication authentication,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.getCustomerOrders(user.getUserId(), keyword, status).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved order history successfully.", list)));
    }

    @Operation(summary = "Customer views order details", description = "View item list, stall address, scheduled pickup time, and cutoff deadline.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/orders/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> getCustomerOrderById(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.getOrderById(id, user.getUserId(), false))
                .map(order -> ResponseEntity.ok(ApiResponse.success("Retrieved order details successfully.", order)));
    }

    @Operation(summary = "Customer cancels order before cutoff time", description = "Only allowed before farmer cutoff deadline. Restores product inventory automatically.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/customer/orders/{id}/cancel")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> cancelOrder(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.cancelOrderByCustomer(user.getUserId(), id))
                .map(cancelled -> ResponseEntity.ok(ApiResponse.success("Order cancelled successfully. Product stock has been restored.", cancelled)));
    }

    @Operation(summary = "Customer modifies order before cutoff deadline", description = "Change pickup slot, pickup date, or order notes before farmer cutoff deadline.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/customer/orders/{id}/modify")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> modifyOrder(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody OrderModifyRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.modifyOrderByCustomer(user.getUserId(), id, request))
                .map(modified -> ResponseEntity.ok(ApiResponse.success("Order updated successfully.", modified)));
    }

    @Operation(summary = "Customer re-orders from past order", description = "Recreates previous item list into a new pre-order with selected market date and pickup slot.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/customer/orders/{id}/reorder")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> reorder(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody ReorderRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> orderService.reorder(user.getUserId(), id, request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Re-order placed successfully. See you at the market session!", created)));
    }

    // ==========================================
    // 2. FARMER ENDPOINTS
    // ==========================================

    @Operation(summary = "Farmer views stall orders", description = "Filter by market date (pickupDate), keyword search, or order status.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getFarmerOrders(
            Authentication authentication,
            @RequestParam(value = "pickupDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate pickupDate,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "keyword", required = false) String keyword) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> orderService.getFarmerOrders(user.getUserId(), pickupDate, status, keyword).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved farmer order list successfully.", list)));
    }

    @Operation(summary = "Farmer views order details", description = "View customer details, items to prepare, and order notes.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> getFarmerOrderById(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> orderService.getOrderById(id, user.getUserId(), true))
                .map(order -> ResponseEntity.ok(ApiResponse.success("Retrieved order details successfully.", order)));
    }

    @Operation(summary = "Farmer updates order status", description = "Change status: ACCEPTED, READY_FOR_PICKUP, COMPLETED, or DECLINED.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/farmer/orders/{id}/status")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> updateOrderStatus(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> orderService.updateOrderStatusByFarmer(user.getUserId(), id, request))
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Updated order status successfully.", updated)));
    }

    @Operation(summary = "Farmer views order summary statistics", description = "Total orders, actual revenue from completed orders, and order counts by status.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/summary")
    public Mono<ResponseEntity<ApiResponse<OrderSummaryResponse>>> getFarmerSummary(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> orderService.getFarmerSummary(user.getUserId()))
                .map(summary -> ResponseEntity.ok(ApiResponse.success("Retrieved order statistics successfully.", summary)));
    }

    @Operation(summary = "Farmer views best-selling produce insights", description = "Aggregates top-selling products from completed pre-orders at market sessions.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/insights/best-selling")
    public Mono<ResponseEntity<ApiResponse<List<BestSellingProductDto>>>> getBestSellingProducts(
            Authentication authentication,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> orderService.getFarmerBestSelling(user.getUserId(), limit).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved best-selling products successfully.", list)));
    }

    // ==========================================
    // 3. ADMIN ENDPOINTS
    // ==========================================

    @Operation(summary = "Administrator views all orders", description = "Requires ROLE_ADMIN authority. Supports keyword search, status, market, and date filters.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getAllOrdersForAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "marketId", required = false) Long marketId,
            @RequestParam(value = "pickupDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate pickupDate) {
        return orderService.getAllOrdersForAdmin(keyword, status, marketId, pickupDate)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved all system orders successfully.", list)));
    }
}
