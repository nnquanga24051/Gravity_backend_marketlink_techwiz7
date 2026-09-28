package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateRequest;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateResponse;
import com.gravity.marketlink.modules.product.service.StockTemplateService;
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

@Tag(name = "4. Weekly Stock Templates", description = "APIs for configuring recurring weekly inventory quotas by day of week for Farmers")
@RestController
@RequestMapping(value = {"/api/farmer/stock-templates", "/api/farmer/weekly-stock"})
@RequiredArgsConstructor
public class StockTemplateController {

    private final StockTemplateService stockTemplateService;
    private final UserRepository userRepository;

    @Operation(summary = "Get farmer weekly stock template list", description = "Retrieves recurring weekly stock quotas by market session and keyword search.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<WeeklyStockTemplateResponse>>>> getTemplates(
            Authentication authentication,
            @RequestParam(value = "marketId", required = false) Long marketId,
            @RequestParam(value = "keyword", required = false) String keyword) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> stockTemplateService.getTemplates(user.getUserId(), marketId, keyword).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved stock template list successfully.", list)));
    }

    @Operation(summary = "Create or update stock template", description = "Configures recurring inventory allocation by day of week (1: Monday ... 7: Sunday) for product at market.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<WeeklyStockTemplateResponse>>> saveTemplate(
            Authentication authentication,
            @Valid @RequestBody WeeklyStockTemplateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> stockTemplateService.saveTemplate(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Saved stock template successfully.", res)));
    }

    @Operation(summary = "Delete a stock template", description = "Delete stock template by ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteTemplate(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> stockTemplateService.deleteTemplate(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Deleted stock template successfully.", null)));
    }
}
