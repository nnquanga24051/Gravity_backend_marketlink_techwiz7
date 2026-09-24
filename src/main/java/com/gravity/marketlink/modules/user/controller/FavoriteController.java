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

@Tag(name = "1. Danh sách yêu thích (Favorites)", description = "Các API lưu và quản lý danh sách yêu thích: Nông dân, Sản phẩm, Phiên chợ")
@RestController
@RequestMapping("/api/customer/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    @Operation(summary = "Lấy danh sách mục yêu thích của khách hàng", description = "Có thể lọc theo loại: FARMER, PRODUCT, hoặc MARKET.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FavoriteResponse>>>> getFavorites(
            Authentication authentication,
            @RequestParam(value = "targetType", required = false) String targetType) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> favoriteService.getFavorites(user.getUserId(), targetType).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu thích thành công.", list)));
    }

    @Operation(summary = "Kiểm tra xem một mục đã được yêu thích chưa", description = "Trả về boolean isFavorite.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> favoriteService.isFavorite(user.getUserId(), targetType, targetId))
                .map(fav -> ResponseEntity.ok(ApiResponse.success("Kiểm tra yêu thích thành công.", Map.of("isFavorite", fav))));
    }

    @Operation(summary = "Thêm một mục vào danh sách yêu thích", description = "targetType: FARMER, PRODUCT, MARKET.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FavoriteResponse>>> addFavorite(
            Authentication authentication,
            @Valid @RequestBody FavoriteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> favoriteService.addFavorite(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Đã thêm vào mục yêu thích.", res)));
    }

    @Operation(summary = "Xóa một mục khỏi danh sách yêu thích", description = "Xóa theo targetType và targetId.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> favoriteService.removeFavorite(user.getUserId(), targetType, targetId))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Đã xóa khỏi mục yêu thích.", null)));
    }
}
