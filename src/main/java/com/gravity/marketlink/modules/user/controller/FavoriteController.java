package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.FavoriteRequest;
import com.gravity.marketlink.modules.user.dto.FavoriteResponse;
import com.gravity.marketlink.modules.user.service.FavoriteService;
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
import java.util.Map;

@Tag(name = "1. Favorites", description = "APIs for saving and managing favorites: Farmers, Products, Markets")
@RestController
@RequestMapping("/api/customer/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    @Operation(summary = "Get customer favorite items", description = "Can filter by type: FARMER, PRODUCT, or MARKET.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FavoriteResponse>>>> getFavorites(
            Authentication authentication,
            @RequestParam(value = "targetType", required = false) String targetType) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> favoriteService.getFavorites(user.getUserId(), targetType).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved favorites successfully.", list)));
    }

    @Operation(summary = "Check if an item is favorited", description = "Returns boolean isFavorite.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/check")
    public Mono<ResponseEntity<ApiResponse<Map<String, Boolean>>>> checkFavorite(
            Authentication authentication,
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") Long targetId) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> favoriteService.isFavorite(user.getUserId(), targetType, targetId))
                .map(fav -> ResponseEntity.ok(ApiResponse.success("Checked favorite status successfully.", Map.of("isFavorite", fav))));
    }

    @Operation(summary = "Add item to favorites", description = "targetType: FARMER, PRODUCT, MARKET.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FavoriteResponse>>> addFavorite(
            Authentication authentication,
            @Valid @RequestBody FavoriteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> favoriteService.addFavorite(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Added to favorites.", res)));
    }

    @Operation(summary = "Remove item from favorites", description = "Remove by targetType and targetId.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping
    public Mono<ResponseEntity<ApiResponse<Void>>> removeFavorite(
            Authentication authentication,
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") Long targetId) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> favoriteService.removeFavorite(user.getUserId(), targetType, targetId))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Removed from favorites.", null)));
    }
}
