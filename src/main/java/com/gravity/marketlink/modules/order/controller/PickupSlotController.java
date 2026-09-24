package com.gravity.marketlink.modules.order.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.order.dto.PickupSlotRequest;
import com.gravity.marketlink.modules.order.dto.PickupSlotResponse;
import com.gravity.marketlink.modules.order.service.PickupSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "5. Khung giờ nhận hàng (Pickup Time Slots)", description = "Các API ca nhận hàng tại chợ nông sản (Customer xem và Nông dân thiết lập)")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PickupSlotController {

    private final PickupSlotService pickupSlotService;
    private final UserRepository userRepository;

    @Operation(summary = "Khách hàng xem các ca nhận hàng tại chợ", description = "Lấy danh sách các khung giờ nhận hàng tại một chợ. Có thể lọc theo gian hàng nông dân (farmerId).")
    @GetMapping("/markets/{marketId}/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<List<PickupSlotResponse>>>> getSlotsByMarket(
            @PathVariable("marketId") Long marketId,
            @RequestParam(value = "farmerId", required = false) Long farmerId) {
        return pickupSlotService.getSlotsByMarket(marketId, farmerId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách ca nhận hàng thành công.", list)));
    }

    @Operation(summary = "Nông dân xem danh sách ca đón khách của sạp mình", description = "Yêu cầu quyền ROLE_FARMER.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<List<PickupSlotResponse>>>> getFarmerSlots(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> pickupSlotService.getSlotsByFarmer(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách ca nhận hàng của nông dân thành công.", list)));
    }

    @Operation(summary = "Nông dân tạo ca nhận hàng mới", description = "Tạo khung giờ đón khách tại phiên chợ (VD: 07:00 - 08:00, sức chứa 15 đơn).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/farmer/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<PickupSlotResponse>>> createSlot(
            Authentication authentication,
            @Valid @RequestBody PickupSlotRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> pickupSlotService.createSlot(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Tạo ca nhận hàng mới thành công.", res)));
    }

    @Operation(summary = "Nông dân xóa ca nhận hàng", description = "Xóa ca nhận hàng theo ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/farmer/pickup-slots/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteSlot(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> pickupSlotService.deleteSlot(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Xóa ca nhận hàng thành công.", null)));
    }
}
