package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingRequest;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingResponse;
import com.gravity.marketlink.modules.product.service.CutoffSettingService;
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

@Tag(name = "4. Farmer Cutoff Settings", description = "APIs for setting pre-order cutoff hours before market opening for Farmers")
@RestController
@RequestMapping("/api/farmer/cutoff-settings")
@RequiredArgsConstructor
public class CutoffController {

    private final CutoffSettingService cutoffSettingService;
    private final UserRepository userRepository;

    @Operation(summary = "View farmer cutoff configurations", description = "Retrieves all cutoff configurations by market and day of week.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FarmerCutoffSettingResponse>>>> getSettings(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> cutoffSettingService.getSettings(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved cutoff configurations successfully.", list)));
    }

    @Operation(summary = "Create or update cutoff hours", description = "Configures pre-order cutoff hours before market opens (e.g. 12 hours).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FarmerCutoffSettingResponse>>> saveSetting(
            Authentication authentication,
            @Valid @RequestBody FarmerCutoffSettingRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> cutoffSettingService.saveSetting(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Saved cutoff configuration successfully.", res)));
    }

    @Operation(summary = "Delete cutoff configuration", description = "Delete cutoff configuration theo ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteSetting(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> cutoffSettingService.deleteSetting(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Deleted cutoff configuration successfully.", null)));
    }
}
