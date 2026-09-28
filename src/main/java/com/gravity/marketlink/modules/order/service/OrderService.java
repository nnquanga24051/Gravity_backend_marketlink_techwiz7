package com.gravity.marketlink.modules.order.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.market.repository.MarketScheduleRepository;
import com.gravity.marketlink.modules.notification.service.NotificationService;
import com.gravity.marketlink.modules.order.dto.*;
import com.gravity.marketlink.modules.order.entity.Order;
import com.gravity.marketlink.modules.order.entity.OrderItem;
import com.gravity.marketlink.modules.order.entity.PickupTimeSlot;
import com.gravity.marketlink.modules.order.repository.OrderItemRepository;
import com.gravity.marketlink.modules.order.repository.OrderRepository;
import com.gravity.marketlink.modules.order.repository.PickupTimeSlotRepository;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.repository.FarmerCutoffSettingRepository;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import com.gravity.marketlink.modules.review.repository.ReviewRepository;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final PickupTimeSlotRepository slotRepository;
    private final FarmerCutoffSettingRepository cutoffRepository;
    private final MarketScheduleRepository scheduleRepository;
    private final MarketRepository marketRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DatabaseClient databaseClient;
    private final ReviewRepository reviewRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public Mono<OrderDetailResponse> createOrder(Long customerId, OrderCreateRequest request) {
        if (request.getPickupDate().isBefore(LocalDate.now())) {
            return Mono.error(new IllegalArgumentException("Pickup date cannot be in the past."));
        }

        return farmerProfileRepository.findById(request.getFarmerId())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer stall not found.")))
                .flatMap(farmer -> {
                    if (farmer.getIsApproved() == null || !farmer.getIsApproved()) {
                        return Mono.error(new IllegalStateException("Farmer stall has not been KYC approved, cannot receive orders yet."));
                    }

                    return marketRepository.findById(request.getMarketId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmers market not found with ID: " + request.getMarketId())));
                })
                .flatMap(market -> slotRepository.findById(request.getSlotId())
                        .switchIfEmpty(Mono.error(new ResourceNotFoundException("Pickup slot not found with ID: " + request.getSlotId())))
                        .flatMap(slot -> {
                            if (!slot.getFarmerId().equals(request.getFarmerId()) || !slot.getMarketId().equals(request.getMarketId())) {
                                return Mono.error(new IllegalArgumentException("Pickup slot does not belong to selected stall or market."));
                            }

                            return orderRepository.countActiveOrdersInSlot(slot.getSlotId(), request.getPickupDate())
                                    .flatMap(activeOrders -> {
                                        if (activeOrders >= slot.getMaxOrdersCapacity()) {
                                            return Mono.error(new IllegalStateException("This pickup slot has reached maximum capacity ("
                                                    + slot.getMaxOrdersCapacity() + " orders). Please choose another pickup slot."));
                                        }
                                        return calculateCutoffTime(request.getFarmerId(), request.getMarketId(), request.getPickupDate(), slot.getStartTime())
                                                .flatMap(cutoffTime -> {
                                                    if (LocalDateTime.now().isAfter(cutoffTime)) {
                                                        return Mono.error(new IllegalStateException("Pre-order cutoff deadline has passed ("
                                                                + cutoffTime.format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                                                                + ") for market session date " + request.getPickupDate() + ". The farmer has stopped accepting orders."));
                                                    }
                                                    return processOrderItemsAndSave(customerId, request, slot, cutoffTime);
                                                });
                                    });
                        }));
    }

    private Mono<LocalDateTime> calculateCutoffTime(Long farmerId, Long marketId, LocalDate pickupDate, LocalTime defaultSlotStart) {
        int dayOfWeek = pickupDate.getDayOfWeek().getValue();

        Mono<LocalTime> marketOpenTimeMono = scheduleRepository.findByMarketIdAndDayOfWeek(marketId, dayOfWeek)
                .next()
                .map(schedule -> schedule.getOpenTime())
                .defaultIfEmpty(defaultSlotStart != null ? defaultSlotStart : LocalTime.of(7, 0));

        Mono<Integer> cutoffHoursMono = cutoffRepository.findByFarmerIdAndMarketIdAndDayOfWeek(farmerId, marketId, dayOfWeek)
                .map(setting -> setting.getCutoffHoursBefore())
                .defaultIfEmpty(12); // Default 12 hours before market opens

        return Mono.zip(marketOpenTimeMono, cutoffHoursMono)
                .map(tuple -> {
                    LocalTime openTime = tuple.getT1();
                    int cutoffHours = tuple.getT2();
                    LocalDateTime marketOpenDateTime = pickupDate.atTime(openTime);
                    return marketOpenDateTime.minusHours(cutoffHours);
                });
    }

    private Mono<OrderDetailResponse> processOrderItemsAndSave(Long customerId, OrderCreateRequest request, PickupTimeSlot slot, LocalDateTime cutoffTime) {
        return Flux.fromIterable(request.getItems())
                .concatMap(itemReq -> productRepository.findById(itemReq.getProductId())
                        .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId())))
                        .flatMap(product -> {
                            if (!product.getFarmerId().equals(request.getFarmerId())) {
                                return Mono.error(new IllegalArgumentException("Product '" + product.getName() + "' does not belong to this farmer stall."));
                            }
                            if ("BANNED".equalsIgnoreCase(product.getStatus()) || "TEMPORARILY_UNAVAILABLE".equalsIgnoreCase(product.getStatus())) {
                                return Mono.error(new IllegalStateException("Product '" + product.getName() + "' is currently unavailable for pre-order."));
                            }
                            if (product.getCurrentStock() == null || product.getCurrentStock().compareTo(itemReq.getQuantity()) < 0) {
                                return Mono.error(new IllegalStateException("Product '" + product.getName() + "' has insufficient inventory (Available: "
                                        + (product.getCurrentStock() != null ? product.getCurrentStock() : 0) + " " + product.getUnit() + ")."));
                            }

                            BigDecimal newStock = product.getCurrentStock().subtract(itemReq.getQuantity());
                            product.setCurrentStock(newStock);
                            if (newStock.compareTo(BigDecimal.ZERO) <= 0) {
                                product.setStatus("SOLD_OUT");
                            }

                            BigDecimal subtotal = product.getPrice().multiply(itemReq.getQuantity());

                            return productRepository.save(product)
                                    .map(savedProd -> new PreparedOrderItem(savedProd, itemReq.getQuantity(), savedProd.getPrice(), subtotal));
                        }))
                .collectList()
                .flatMap(preparedItems -> {
                    BigDecimal totalAmount = preparedItems.stream()
                            .map(PreparedOrderItem::subtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    String orderCode = "ORD-" + request.getPickupDate().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                            + "-" + ThreadLocalRandom.current().nextInt(1000, 9999);

                    Order order = Order.builder()
                            .orderCode(orderCode)
                            .customerId(customerId)
                            .farmerId(request.getFarmerId())
                            .marketId(request.getMarketId())
                            .slotId(slot.getSlotId())
                            .pickupDate(request.getPickupDate())
                            .cutoffTime(cutoffTime)
                            .totalAmount(totalAmount)
                            .orderStatus("PLACED")
                            .paymentMethod("PAY_AT_PICKUP")
                            .note(request.getNote())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return orderRepository.save(order)
                            .flatMap(savedOrder -> {
                                List<OrderItem> itemsToSave = preparedItems.stream()
                                        .map(item -> OrderItem.builder()
                                                .orderId(savedOrder.getOrderId())
                                                .productId(item.product().getProductId())
                                                .quantity(item.quantity())
                                                .unitPrice(item.unitPrice())
                                                .subtotal(item.subtotal())
                                                .build())
                                        .toList();

                                return orderItemRepository.saveAll(itemsToSave)
                                        .collectList()
                                        .flatMap(savedItems -> {
                                            String notifMsg = "Customer placed new pre-order " + savedOrder.getOrderCode()
                                                    + " valued at " + String.format("%,.0f", totalAmount) + " VND for pickup date "
                                                    + savedOrder.getPickupDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ".";

                                            return notificationService.createNotification(
                                                    savedOrder.getFarmerId(),
                                                    "New Pre-order: " + savedOrder.getOrderCode(),
                                                    notifMsg,
                                                    "ORDER_PLACED",
                                                    savedOrder.getOrderId())
                                                    .then(enrichOrderDetail(savedOrder));
                                        });
                            });
                });
    }

    private record PreparedOrderItem(Product product, BigDecimal quantity, BigDecimal unitPrice, BigDecimal subtotal) {}

    @Transactional
    public Mono<OrderDetailResponse> cancelOrderByCustomer(Long customerId, Long orderId) {
        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with ID: " + orderId)))
                .flatMap(order -> {
                    if (!order.getCustomerId().equals(customerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to operate on this order."));
                    }

                    if (!"PLACED".equalsIgnoreCase(order.getOrderStatus()) && !"ACCEPTED".equalsIgnoreCase(order.getOrderStatus())) {
                        return Mono.error(new IllegalStateException("Can only cancel order in PLACED or ACCEPTED status. Current status: " + order.getOrderStatus()));
                    }

                    if (LocalDateTime.now().isAfter(order.getCutoffTime())) {
                        return Mono.error(new IllegalStateException("Pre-order cutoff deadline has passed ("
                                + order.getCutoffTime().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                                + "). You cannot cancel this order directly, please contact the farmer directly for assistance."));
                    }

                    order.setOrderStatus("CANCELLED");
                    order.setUpdatedAt(LocalDateTime.now());

                    return orderRepository.save(order)
                            .flatMap(savedOrder -> restoreStockForOrder(savedOrder.getOrderId())
                                    .then(notificationService.createNotification(
                                            savedOrder.getFarmerId(),
                                            "Customer cancelled order: " + savedOrder.getOrderCode(),
                                            "Order " + savedOrder.getOrderCode() + " was cancelled by customer before cutoff. Stock quantity has been automatically restored.",
                                            "ORDER_PLACED",
                                            savedOrder.getOrderId()))
                                    .then(enrichOrderDetail(savedOrder)));
                });
    }

    /**
     * Customer modifies order before cutoff deadline (Modify Order before Cutoff)
     */
    @Transactional
    public Mono<OrderDetailResponse> modifyOrderByCustomer(Long customerId, Long orderId, OrderModifyRequest request) {
        if (request.getPickupDate().isBefore(LocalDate.now())) {
            return Mono.error(new IllegalArgumentException("Pickup date cannot be in the past."));
        }

        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with ID: " + orderId)))
                .flatMap(order -> {
                    if (!order.getCustomerId().equals(customerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to operate on this order."));
                    }

                    if (!"PLACED".equalsIgnoreCase(order.getOrderStatus()) && !"ACCEPTED".equalsIgnoreCase(order.getOrderStatus())) {
                        return Mono.error(new IllegalStateException("Can only modify order in PLACED or ACCEPTED status. Current status: " + order.getOrderStatus()));
                    }

                    if (order.getCutoffTime() != null && LocalDateTime.now().isAfter(order.getCutoffTime())) {
                        return Mono.error(new IllegalStateException("Pre-order cutoff deadline has passed ("
                                + order.getCutoffTime().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                                + "). You cannot modify this order directly, please contact the farmer directly for assistance."));
                    }

                    return slotRepository.findById(request.getSlotId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Pickup slot not found with ID: " + request.getSlotId())))
                            .flatMap(slot -> {
                                if (!slot.getFarmerId().equals(order.getFarmerId()) || !slot.getMarketId().equals(order.getMarketId())) {
                                    return Mono.error(new IllegalArgumentException("Pickup slot does not belong to this order's stall or market."));
                                }

                                return orderRepository.countActiveOrdersInSlot(slot.getSlotId(), request.getPickupDate())
                                        .flatMap(activeCount -> {
                                            long effectiveCount = (order.getSlotId().equals(slot.getSlotId()) && order.getPickupDate().equals(request.getPickupDate()))
                                                    ? activeCount - 1
                                                    : activeCount;

                                            if (effectiveCount >= slot.getMaxOrdersCapacity()) {
                                                return Mono.error(new IllegalStateException("This new pickup slot has reached maximum capacity ("
                                                        + slot.getMaxOrdersCapacity() + " orders). Please choose another pickup slot."));
                                            }

                                            return calculateCutoffTime(order.getFarmerId(), order.getMarketId(), request.getPickupDate(), slot.getStartTime())
                                                    .flatMap(newCutoff -> {
                                                        if (LocalDateTime.now().isAfter(newCutoff)) {
                                                            return Mono.error(new IllegalStateException("Pre-order cutoff deadline has passed ("
                                                                    + newCutoff.format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"))
                                                                    + ") for this new pickup date. The farmer has stopped accepting orders."));
                                                        }

                                                        order.setSlotId(request.getSlotId());
                                                        order.setPickupDate(request.getPickupDate());
                                                        order.setCutoffTime(newCutoff);
                                                        if (request.getNote() != null) {
                                                            order.setNote(request.getNote());
                                                        }
                                                        order.setUpdatedAt(LocalDateTime.now());

                                                        return orderRepository.save(order)
                                                                .flatMap(savedOrder -> notificationService.createNotification(
                                                                        savedOrder.getFarmerId(),
                                                                        "Customer updated order: " + savedOrder.getOrderCode(),
                                                                        "Order " + savedOrder.getOrderCode() + " has been adjusted by customer to pickup date "
                                                                                + savedOrder.getPickupDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ".",
                                                                        "ORDER_PLACED",
                                                                        savedOrder.getOrderId())
                                                                        .then(enrichOrderDetail(savedOrder)));
                                                    });
                                        });
                            });
                });
    }

    @Transactional
    public Mono<OrderDetailResponse> updateOrderStatusByFarmer(Long farmerId, Long orderId, OrderStatusUpdateRequest request) {
        String newStatus = request.getOrderStatus().toUpperCase().trim();

        if (!List.of("ACCEPTED", "READY_FOR_PICKUP", "COMPLETED", "DECLINED").contains(newStatus)) {
            return Mono.error(new IllegalArgumentException("Invalid status. Only ACCEPTED, READY_FOR_PICKUP, COMPLETED, DECLINED are supported."));
        }

        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with ID: " + orderId)))
                .flatMap(order -> {
                    if (!order.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("This order does not belong to your stall."));
                    }

                    if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus()) 
                            || "COMPLETED".equalsIgnoreCase(order.getOrderStatus())
                            || "DECLINED".equalsIgnoreCase(order.getOrderStatus())) {
                        return Mono.error(new IllegalStateException("Order is already in a terminal state (" + order.getOrderStatus() + "), cannot be updated further."));
                    }

                    order.setOrderStatus(newStatus);
                    order.setUpdatedAt(LocalDateTime.now());

                    final StatusNotification notif = resolveStatusNotification(order, newStatus);
                    final Mono<Void> postProcessMono = "DECLINED".equalsIgnoreCase(newStatus)
                            ? restoreStockForOrder(order.getOrderId())
                            : Mono.empty();

                    return orderRepository.save(order)
                            .flatMap(savedOrder -> postProcessMono
                                    .then(notificationService.createNotification(savedOrder.getCustomerId(), notif.title(), notif.message(), notif.type(), savedOrder.getOrderId()))
                                    .then(enrichOrderDetail(savedOrder)));
                });
    }

    private StatusNotification resolveStatusNotification(Order order, String newStatus) {
        return switch (newStatus) {
            case "ACCEPTED" -> new StatusNotification(
                    "Order " + order.getOrderCode() + " has been confirmed",
                    "Farmer stall has accepted and is preparing your pre-order for pickup date "
                            + order.getPickupDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ".",
                    "ORDER_ACCEPTED");
            case "READY_FOR_PICKUP" -> new StatusNotification(
                    "Order " + order.getOrderCode() + " is ready for pickup!",
                    "Your fresh produce has been packaged and is ready at the market stall. Please pick it up on time!",
                    "ORDER_READY");
            case "COMPLETED" -> new StatusNotification(
                    "Order " + order.getOrderCode() + " has been completed",
                    "Thank you for picking up and supporting local produce. Please leave a review for the farmer stall!",
                    "SYSTEM");
            case "DECLINED" -> new StatusNotification(
                    "Order " + order.getOrderCode() + " was declined",
                    "We apologize, the farmer cannot accept this order due to inventory shortage.",
                    "SYSTEM");
            default -> new StatusNotification(
                    "Order Update " + order.getOrderCode(),
                    "Your order status has changed to: " + newStatus,
                    "SYSTEM");
        };
    }

    private record StatusNotification(String title, String message, String type) {}

    private Mono<Void> restoreStockForOrder(Long orderId) {
        return orderItemRepository.findByOrderId(orderId)
                .collectList()
                .flatMap(items -> {
                    Map<Long, BigDecimal> qtyByProduct = items.stream()
                            .filter(it -> it.getProductId() != null && it.getQuantity() != null)
                            .collect(Collectors.toMap(
                                    OrderItem::getProductId,
                                    OrderItem::getQuantity,
                                    BigDecimal::add
                            ));

                    return Flux.fromIterable(qtyByProduct.entrySet())
                            .concatMap(entry -> productRepository.findById(entry.getKey())
                                    .flatMap(prod -> {
                                        BigDecimal current = prod.getCurrentStock() != null ? prod.getCurrentStock() : BigDecimal.ZERO;
                                        prod.setCurrentStock(current.add(entry.getValue()));
                                        if ("SOLD_OUT".equalsIgnoreCase(prod.getStatus())) {
                                            prod.setStatus("AVAILABLE");
                                        }
                                        return productRepository.save(prod);
                                    }))
                            .then();
                });
    }

    public Flux<OrderDetailResponse> getCustomerOrders(Long customerId, String keyword, String status) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .flatMap(this::enrichOrderDetail)
                .filter(o -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                        String st = status.trim().toUpperCase();
                        if ("READY".equals(st)) {
                            if (!"READY".equals(o.getOrderStatus()) && !"READY_FOR_PICKUP".equals(o.getOrderStatus())) return false;
                        } else if ("PENDING".equals(st)) {
                            if (!"PENDING".equals(o.getOrderStatus()) && !"PLACED".equals(o.getOrderStatus()) && !"ACCEPTED".equals(o.getOrderStatus())) return false;
                        } else {
                            if (!st.equalsIgnoreCase(o.getOrderStatus())) return false;
                        }
                    }
                    if (!kw.isEmpty()) {
                        boolean matchId = o.getOrderId() != null && o.getOrderId().toString().contains(kw);
                        boolean matchCode = o.getOrderCode() != null && o.getOrderCode().toLowerCase().contains(kw);
                        boolean matchMarket = o.getMarketName() != null && o.getMarketName().toLowerCase().contains(kw);
                        boolean matchFarmer = o.getFarmerName() != null && o.getFarmerName().toLowerCase().contains(kw);
                        boolean matchItems = o.getItems() != null && o.getItems().stream()
                                .anyMatch(it -> it.getProductName() != null && it.getProductName().toLowerCase().contains(kw));
                        if (!matchId && !matchCode && !matchMarket && !matchFarmer && !matchItems) return false;
                    }
                    return true;
                });
    }

    public Flux<OrderDetailResponse> getCustomerOrders(Long customerId) {
        return getCustomerOrders(customerId, null, null);
    }

    public Flux<OrderDetailResponse> getFarmerOrders(Long farmerId, LocalDate pickupDate, String status, String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId)
                .filter(o -> pickupDate == null || pickupDate.equals(o.getPickupDate()))
                .filter(o -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                        String st = status.trim().toUpperCase();
                        if ("DECLINED_CANCELLED".equals(st)) {
                            return "DECLINED".equalsIgnoreCase(o.getOrderStatus()) || "CANCELLED".equalsIgnoreCase(o.getOrderStatus());
                        }
                        return st.equalsIgnoreCase(o.getOrderStatus());
                    }
                    return true;
                })
                .flatMap(this::enrichOrderDetail)
                .filter(o -> {
                    if (!kw.isEmpty()) {
                        boolean matchId = o.getOrderId() != null && o.getOrderId().toString().contains(kw);
                        boolean matchCode = o.getOrderCode() != null && o.getOrderCode().toLowerCase().contains(kw);
                        boolean matchCust = o.getCustomerName() != null && o.getCustomerName().toLowerCase().contains(kw);
                        boolean matchPhone = o.getCustomerPhone() != null && o.getCustomerPhone().contains(kw);
                        boolean matchNote = o.getNote() != null && o.getNote().toLowerCase().contains(kw);
                        boolean matchItems = o.getItems() != null && o.getItems().stream()
                                .anyMatch(it -> it.getProductName() != null && it.getProductName().toLowerCase().contains(kw));
                        if (!matchId && !matchCode && !matchCust && !matchPhone && !matchNote && !matchItems) return false;
                    }
                    return true;
                });
    }

    public Flux<OrderDetailResponse> getFarmerOrders(Long farmerId, LocalDate pickupDate, String status) {
        return getFarmerOrders(farmerId, pickupDate, status, null);
    }

    public Mono<OrderDetailResponse> getOrderById(Long orderId, Long currentUserId, boolean isFarmer) {
        return orderRepository.findById(orderId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with ID: " + orderId)))
                .flatMap(order -> {
                    if (isFarmer && !order.getFarmerId().equals(currentUserId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to access this order."));
                    }
                    if (!isFarmer && !order.getCustomerId().equals(currentUserId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to access this order."));
                    }
                    return enrichOrderDetail(order);
                });
    }

    public Flux<OrderDetailResponse> getAllOrdersForAdmin(String keyword, String status, Long marketId, LocalDate pickupDate) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return orderRepository.findAll()
                .filter(o -> pickupDate == null || pickupDate.equals(o.getPickupDate()))
                .filter(o -> marketId == null || marketId.equals(o.getMarketId()))
                .filter(o -> {
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
                        String st = status.trim().toUpperCase();
                        if ("PENDING".equals(st)) {
                            return "PLACED".equalsIgnoreCase(o.getOrderStatus()) || "ACCEPTED".equalsIgnoreCase(o.getOrderStatus());
                        }
                        if ("CANCELLED".equals(st)) {
                            return "CANCELLED".equalsIgnoreCase(o.getOrderStatus()) || "DECLINED".equalsIgnoreCase(o.getOrderStatus());
                        }
                        return st.equalsIgnoreCase(o.getOrderStatus());
                    }
                    return true;
                })
                .flatMap(this::enrichOrderDetail)
                .filter(o -> {
                    if (!kw.isEmpty()) {
                        boolean matchId = o.getOrderId() != null && o.getOrderId().toString().contains(kw);
                        boolean matchCode = o.getOrderCode() != null && o.getOrderCode().toLowerCase().contains(kw);
                        boolean matchCust = o.getCustomerName() != null && o.getCustomerName().toLowerCase().contains(kw);
                        boolean matchPhone = o.getCustomerPhone() != null && o.getCustomerPhone().contains(kw);
                        boolean matchFarmer = o.getFarmerName() != null && o.getFarmerName().toLowerCase().contains(kw);
                        boolean matchStall = o.getStallName() != null && o.getStallName().toLowerCase().contains(kw);
                        boolean matchMarket = o.getMarketName() != null && o.getMarketName().toLowerCase().contains(kw);
                        boolean matchItems = o.getItems() != null && o.getItems().stream()
                                .anyMatch(it -> it.getProductName() != null && it.getProductName().toLowerCase().contains(kw));
                        if (!matchId && !matchCode && !matchCust && !matchPhone && !matchFarmer && !matchStall && !matchMarket && !matchItems) return false;
                    }
                    return true;
                });
    }

    public Flux<OrderDetailResponse> getAllOrdersForAdmin() {
        return getAllOrdersForAdmin(null, null, null, null);
    }

    public Mono<OrderSummaryResponse> getFarmerSummary(Long farmerId) {
        return orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId)
                .collectList()
                .map(orders -> {
                    long total = orders.size();
                    long placed = orders.stream().filter(o -> "PLACED".equalsIgnoreCase(o.getOrderStatus())).count();
                    long accepted = orders.stream().filter(o -> "ACCEPTED".equalsIgnoreCase(o.getOrderStatus())).count();
                    long ready = orders.stream().filter(o -> "READY_FOR_PICKUP".equalsIgnoreCase(o.getOrderStatus())).count();
                    long completed = orders.stream().filter(o -> "COMPLETED".equalsIgnoreCase(o.getOrderStatus())).count();
                    long cancelled = orders.stream().filter(o -> "CANCELLED".equalsIgnoreCase(o.getOrderStatus())).count();
                    long declined = orders.stream().filter(o -> "DECLINED".equalsIgnoreCase(o.getOrderStatus())).count();

                    BigDecimal revenue = orders.stream()
                            .filter(o -> "COMPLETED".equalsIgnoreCase(o.getOrderStatus()))
                            .map(Order::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return OrderSummaryResponse.builder()
                            .totalOrders(total)
                            .totalRevenue(revenue)
                            .placedOrders(placed)
                            .acceptedOrders(accepted)
                            .readyOrders(ready)
                            .completedOrders(completed)
                            .cancelledOrders(cancelled)
                            .declinedOrders(declined)
                            .build();
                });
    }

    /**
     * Quickly reorder items from past order history (Order History & Reorder)
     */
    @Transactional
    public Mono<OrderDetailResponse> reorder(Long customerId, Long oldOrderId, ReorderRequest request) {
        return orderRepository.findById(oldOrderId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Past order not found with ID: " + oldOrderId)))
                .flatMap(oldOrder -> {
                    if (!oldOrder.getCustomerId().equals(customerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to operate on this order."));
                    }

                    return orderItemRepository.findByOrderId(oldOrderId)
                            .map(item -> OrderItemRequest.builder()
                                    .productId(item.getProductId())
                                    .quantity(item.getQuantity())
                                    .build())
                            .collectList()
                            .flatMap(items -> {
                                if (items.isEmpty()) {
                                    return Mono.error(new IllegalStateException("Past order contains no items to re-order."));
                                }

                                OrderCreateRequest newOrderReq = OrderCreateRequest.builder()
                                        .farmerId(oldOrder.getFarmerId())
                                        .marketId(oldOrder.getMarketId())
                                        .slotId(request.getSlotId())
                                        .pickupDate(request.getPickupDate())
                                        .note(request.getNote() != null && !request.getNote().isBlank()
                                                ? request.getNote()
                                                : "Re-ordered from Order #" + oldOrder.getOrderCode())
                                        .items(items)
                                        .build();

                                return createOrder(customerId, newOrderReq);
                            });
                });
    }

    /**
     * Best-selling products report for farmer stalls (Farmer Insights: Best-Selling)
     */
    public Flux<BestSellingProductDto> getFarmerBestSelling(Long farmerId, int limit) {
        String sql = """
            SELECT oi.product_id, 
                   COALESCE(SUM(oi.quantity), 0) AS total_sold_quantity, 
                   COALESCE(SUM(oi.subtotal), 0) AS total_revenue, 
                   COUNT(DISTINCT o.order_id) AS order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.farmer_id = :farmerId AND o.order_status = 'COMPLETED'
            GROUP BY oi.product_id
            ORDER BY total_sold_quantity DESC
            LIMIT :limit
        """;

        int safeLimit = (limit > 0 && limit <= 50) ? limit : 10;

        return databaseClient.sql(sql)
                .bind("farmerId", farmerId)
                .bind("limit", safeLimit)
                .map((row, metadata) -> BestSellingProductDto.builder()
                        .productId(row.get("product_id", Long.class))
                        .totalSoldQuantity(row.get("total_sold_quantity", BigDecimal.class))
                        .totalRevenue(row.get("total_revenue", BigDecimal.class))
                        .orderCount(row.get("order_count", Long.class))
                        .build())
                .all()
                .flatMap(dto -> productRepository.findById(dto.getProductId())
                        .map(prod -> {
                            dto.setProductName(prod.getName());
                            dto.setUnit(prod.getUnit());
                            dto.setImageUrl(prod.getImageUrl());
                            return dto;
                        })
                        .defaultIfEmpty(dto));
    }

    private Mono<OrderDetailResponse> enrichOrderDetail(Order order) {
        Mono<User> customerMono = userRepository.findById(order.getCustomerId())
                .defaultIfEmpty(User.builder().fullName("Customer #" + order.getCustomerId()).phoneNumber("").build());

        Mono<FarmerProfile> farmerMono = farmerProfileRepository.findById(order.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Stall #" + order.getFarmerId()).build());

        Mono<User> farmerUserMono = userRepository.findById(order.getFarmerId())
                .defaultIfEmpty(User.builder().fullName("Farmer #" + order.getFarmerId()).build());

        Mono<Market> marketMono = marketRepository.findById(order.getMarketId())
                .defaultIfEmpty(Market.builder().name("Market #" + order.getMarketId()).address("").build());

        Mono<PickupTimeSlot> slotMono = slotRepository.findById(order.getSlotId())
                .defaultIfEmpty(PickupTimeSlot.builder().startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(8, 0)).build());

        Mono<List<OrderItemResponse>> itemsMono = orderItemRepository.findByOrderId(order.getOrderId())
                .flatMap(item -> productRepository.findById(item.getProductId())
                        .defaultIfEmpty(Product.builder().name("Produce #" + item.getProductId()).unit("").imageUrl("").build())
                        .map(prod -> OrderItemResponse.builder()
                                .orderItemId(item.getOrderItemId())
                                .productId(item.getProductId())
                                .productName(prod.getName())
                                .productUnit(prod.getUnit())
                                .imageUrl(prod.getImageUrl())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                .subtotal(item.getSubtotal())
                                .build()))
                .collectList();

        // Check if the customer has already reviewed this order
        Mono<Boolean> hasReviewMono = reviewRepository.findByOrderId(order.getOrderId())
                .map(r -> true)
                .defaultIfEmpty(false);

        return Mono.zip(customerMono, farmerMono, farmerUserMono, marketMono, slotMono)
                .zipWith(itemsMono)
                .zipWith(hasReviewMono)
                .map(outerTuple -> {
                    var inner = outerTuple.getT1();
                    Boolean hasReview = outerTuple.getT2();
                    var t1 = inner.getT1();
                    User customer = t1.getT1();
                    FarmerProfile farmerProfile = t1.getT2();
                    User farmerUser = t1.getT3();
                    Market market = t1.getT4();
                    PickupTimeSlot slot = t1.getT5();
                    List<OrderItemResponse> items = inner.getT2();

                    String slotRange = (slot.getStartTime() != null && slot.getEndTime() != null)
                            ? slot.getStartTime().format(TIME_FMT) + " - " + slot.getEndTime().format(TIME_FMT)
                            : "";

                    boolean canCancel = ("PLACED".equalsIgnoreCase(order.getOrderStatus()) || "ACCEPTED".equalsIgnoreCase(order.getOrderStatus()))
                            && order.getCutoffTime() != null
                            && LocalDateTime.now().isBefore(order.getCutoffTime());

                    return OrderDetailResponse.builder()
                            .orderId(order.getOrderId())
                            .orderCode(order.getOrderCode())
                            .customerId(order.getCustomerId())
                            .customerName(customer.getFullName())
                            .customerPhone(customer.getPhoneNumber())
                            .farmerId(order.getFarmerId())
                            .farmerName(farmerUser.getFullName())
                            .stallName(farmerProfile.getStallName())
                            .marketId(order.getMarketId())
                            .marketName(market.getName())
                            .marketAddress(market.getAddress())
                            .slotId(order.getSlotId())
                            .slotTimeRange(slotRange)
                            .pickupDate(order.getPickupDate())
                            .cutoffTime(order.getCutoffTime())
                            .totalAmount(order.getTotalAmount())
                            .orderStatus(order.getOrderStatus())
                            .paymentMethod(order.getPaymentMethod())
                            .note(order.getNote())
                            .canCancel(canCancel)
                            .createdAt(order.getCreatedAt())
                            .updatedAt(order.getUpdatedAt())
                            .items(items)
                            .hasReview(hasReview)
                            .build();
                });
    }
}
