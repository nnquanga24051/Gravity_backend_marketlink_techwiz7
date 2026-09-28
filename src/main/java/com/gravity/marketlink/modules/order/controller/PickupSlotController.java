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

@Tag(name = "5. Pickup Time Slots", description = "APIs for market pickup slots (Customer viewing and Farmer setup)")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PickupSlotController {

    private final PickupSlotService pickupSlotService;
    private final UserRepository userRepository;

    @Operation(summary = "Customer views pickup slots at market", description = "Retrieves pickup time slots at market. Can be filtered by farmer stall (farmerId).")
    @GetMapping("/markets/{marketId}/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<List<PickupSlotResponse>>>> getSlotsByMarket(
            @PathVariable("marketId") Long marketId,
            @RequestParam(value = "farmerId", required = false) Long farmerId) {
        return pickupSlotService.getSlotsByMarket(marketId, farmerId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved pickup slots successfully.", list)));
    }

    @Operation(summary = "Farmer views stall pickup slots", description = "Requires ROLE_FARMER authority.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<List<PickupSlotResponse>>>> getFarmerSlots(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> pickupSlotService.getSlotsByFarmer(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved farmer pickup slots successfully.", list)));
    }

    @Operation(summary = "Farmer creates new pickup slot", description = "Creates customer pickup window at market session (e.g. 07:00 - 08:00, capacity 15 orders).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/farmer/pickup-slots")
    public Mono<ResponseEntity<ApiResponse<PickupSlotResponse>>> createSlot(
            Authentication authentication,
            @Valid @RequestBody PickupSlotRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> pickupSlotService.createSlot(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Created new pickup slot successfully.", res)));
    }

    @Operation(summary = "Farmer deletes pickup slot", description = "Delete pickup slot by ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/farmer/pickup-slots/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteSlot(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> pickupSlotService.deleteSlot(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Deleted pickup slot successfully.", null)));
    }
}
