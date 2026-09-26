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

@Tag(name = "5. Đơn đặt trước nông sản (Orders)", description = "Các API tạo đơn đặt trước, thanh toán tại sạp, theo dõi và cập nhật trạng thái đơn hàng")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. CUSTOMER ENDPOINTS (Dành cho Khách hàng)
    // ==========================================

    @Operation(summary = "Khách hàng tạo đơn đặt trước (Pre-reservation)", description = "Đặt nông sản tươi trước khi phiên chợ họp. Tự động kiểm tra tồn kho, giới hạn ca nhận hàng, tính hạn chốt đơn và gửi thông báo cho nông dân.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/customer/orders")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> createOrder(
            Authentication authentication,
            @Valid @RequestBody OrderCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.createOrder(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Đặt hàng thành công. Hẹn gặp bạn tại phiên chợ!", created)));
    }

    @Operation(summary = "Khách hàng xem lịch sử đơn đặt trước của mình", description = "Lấy danh sách các đơn hàng đã đặt của người dùng đang đăng nhập.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getMyOrders(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.getCustomerOrders(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy lịch sử đơn hàng thành công.", list)));
    }

    @Operation(summary = "Khách hàng xem chi tiết một đơn hàng", description = "Xem đầy đủ danh sách sản phẩm, địa chỉ sạp chợ, thời gian nhận và hạn chốt đơn.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/orders/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> getCustomerOrderById(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.getOrderById(id, user.getUserId(), false))
                .map(order -> ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn hàng thành công.", order)));
    }

    @Operation(summary = "Khách hàng hủy đơn hàng trước hạn chốt đơn (Cutoff Time)", description = "Chỉ cho phép hủy khi chưa qua thời hạn chốt đơn của nông dân. Tự động hoàn tồn kho cho sản phẩm.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/customer/orders/{id}/cancel")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> cancelOrder(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.cancelOrderByCustomer(user.getUserId(), id))
                .map(cancelled -> ResponseEntity.ok(
                        ApiResponse.success("Hủy đơn hàng thành công. Tồn kho sản phẩm đã được hoàn lại.", cancelled)));
    }

    @Operation(summary = "Khách hàng điều chỉnh đơn hàng trước giờ chốt đơn (Modify Order)", description = "Thay đổi ca nhận hàng, ngày lấy hàng hoặc ghi chú trước thời hạn chốt đơn của nông dân.")
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
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.modifyOrderByCustomer(user.getUserId(), id, request))
                .map(modified -> ResponseEntity.ok(ApiResponse.success("Cập nhật đơn hàng thành công.", modified)));
    }

    @Operation(summary = "Khách hàng tái đặt hàng nhanh chóng từ lịch sử (Reorder)", description = "Lấy lại danh sách mặt hàng từ đơn cũ để tạo đơn đặt mới với ngày họp chợ và ca nhận hàng tùy chọn.")
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
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> orderService.reorder(user.getUserId(), id, request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Tái đặt hàng thành công. Hẹn gặp bạn tại phiên chợ!", created)));
    }

    // ==========================================
    // 2. FARMER ENDPOINTS (Dành cho Nông dân)
    // ==========================================

    @Operation(summary = "Nông dân xem danh sách đơn hàng của gian hàng", description = "Lọc theo ngày họp chợ (pickupDate) hoặc trạng thái đơn hàng (orderStatus).")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getFarmerOrders(
            Authentication authentication,
            @RequestParam(value = "pickupDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate pickupDate,
            @RequestParam(value = "status", required = false) String status) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> orderService.getFarmerOrders(user.getUserId(), pickupDate, status).collectList())
                .map(list -> ResponseEntity
                        .ok(ApiResponse.success("Lấy danh sách đơn hàng của nông dân thành công.", list)));
    }

    @Operation(summary = "Nông dân xem chi tiết đơn hàng", description = "Xem chi tiết người mua, mặt hàng cần chuẩn bị, ghi chú đơn hàng.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<OrderDetailResponse>>> getFarmerOrderById(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> orderService.getOrderById(id, user.getUserId(), true))
                .map(order -> ResponseEntity.ok(ApiResponse.success("Lấy chi tiết đơn hàng thành công.", order)));
    }

    @Operation(summary = "Nông dân cập nhật trạng thái đơn hàng", description = "Chuyển trạng thái: ACCEPTED (Đã tiếp nhận), READY_FOR_PICKUP (Đã sẵn sàng tại sạp), COMPLETED (Khách đã nhận & trả tiền), DECLINED (Từ chối).")
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
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> orderService.updateOrderStatusByFarmer(user.getUserId(), id, request))
                .map(updated -> ResponseEntity
                        .ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công.", updated)));
    }

    @Operation(summary = "Nông dân xem tổng quan thống kê đơn hàng", description = "Tổng số đơn hàng, doanh thu thực tế từ đơn hoàn thành, số lượng đơn theo từng trạng thái.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/summary")
    public Mono<ResponseEntity<ApiResponse<OrderSummaryResponse>>> getFarmerSummary(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> orderService.getFarmerSummary(user.getUserId()))
                .map(summary -> ResponseEntity.ok(ApiResponse.success("Lấy thống kê đơn hàng thành công.", summary)));
    }

    @Operation(summary = "Nông dân xem sản phẩm bán chạy nhất (Farmer Insights: Best-Selling)", description = "Thống kê top sản phẩm bán chạy nhất từ các đơn hàng đã hoàn tất tại các phiên chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/orders/insights/best-selling")
    public Mono<ResponseEntity<ApiResponse<List<BestSellingProductDto>>>> getBestSellingProducts(
            Authentication authentication,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> orderService.getFarmerBestSelling(user.getUserId(), limit).collectList())
                .map(list -> ResponseEntity
                        .ok(ApiResponse.success("Lấy danh sách sản phẩm bán chạy nhất thành công.", list)));
    }

    // ==========================================
    // 3. ADMIN ENDPOINTS (Dành cho Quản trị viên)
    // ==========================================

    @Operation(summary = "Quản trị viên xem tất cả các đơn hàng", description = "Yêu cầu quyền ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/orders")
    public Mono<ResponseEntity<ApiResponse<List<OrderDetailResponse>>>> getAllOrdersForAdmin() {
        return orderService.getAllOrdersForAdmin()
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ đơn hàng hệ thống thành công.", list)));
    }
}
