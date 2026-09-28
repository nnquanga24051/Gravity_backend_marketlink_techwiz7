package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.product.dto.ProductCreateRequest;
import com.gravity.marketlink.modules.product.dto.ProductResponse;
import com.gravity.marketlink.modules.product.dto.ProductUpdateRequest;
import com.gravity.marketlink.modules.product.service.ProductService;
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

@Tag(name = "4. Products & Fresh Produce", description = "APIs for searching/browsing produce for customers and inventory management for Farmers")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. PUBLIC ENDPOINTS (Customers & General Users)
    // ==========================================

    @Operation(summary = "Search and browse fresh produce", description = "Filter produce by category (categoryId), farmer (farmerId), market (marketId), stall (stallNumber), keyword, or status.")
    @GetMapping("/products")
    public Mono<ResponseEntity<ApiResponse<List<ProductResponse>>>> getAllProducts(
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "farmerId", required = false) Long farmerId,
            @RequestParam(value = "marketId", required = false) Long marketId,
            @RequestParam(value = "stallNumber", required = false) String stallNumber,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false, defaultValue = "AVAILABLE") String status) {
        return productService.getAllProducts(categoryId, farmerId, marketId, stallNumber, keyword, status)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved product list successfully.", list)));
    }

    @Operation(summary = "Search products by keyword", description = "Quick search for produce by keyword and category.")
    @GetMapping("/products/search")
    public Mono<ResponseEntity<ApiResponse<List<ProductResponse>>>> searchProducts(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) Integer categoryId) {
        return productService.searchProducts(keyword, categoryId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Searched products successfully.", list)));
    }

    @Operation(summary = "View product details", description = "Retrieves full produce details, images, unit price, available pre-order stock, and farmer stall info.")
    @GetMapping("/products/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> getProductById(@PathVariable("id") Long id) {
        return productService.getProductById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.success("Retrieved product details successfully.", p)));
    }

    // ==========================================
    // 2. FARMER ENDPOINTS (Farmer Management)
    // ==========================================

    @Operation(summary = "Farmer views stall product list", description = "Requires ROLE_FARMER authority. Returns all items belonging to farmer stall with filters.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/products")
    public Mono<ResponseEntity<ApiResponse<List<ProductResponse>>>> getMyProducts(
            Authentication authentication,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "marketId", required = false) Long marketId,
            @RequestParam(value = "status", required = false) String status) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> productService.getFarmerProducts(user.getUserId(), keyword, categoryId, marketId, status).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved farmer product list successfully.", list)));
    }

    @Operation(summary = "Farmer creates new product", description = "Requires ROLE_FARMER authority and approved KYC verification (is_approved = true).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/farmer/products")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> createProduct(
            Authentication authentication,
            @Valid @RequestBody ProductCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> productService.createProduct(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Created new product successfully.", created)));
    }

    @Operation(summary = "Farmer updates product details and stock", description = "Requires ROLE_FARMER authority. Allows updating unit price, pre-order inventory, image, and description.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/farmer/products/{id}")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> updateProduct(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> productService.updateProduct(user.getUserId(), id, request))
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Updated product information successfully.", updated)));
    }

    @Operation(summary = "Farmer updates product sale status", description = "Change product status: AVAILABLE, SOLD_OUT, or TEMPORARILY_UNAVAILABLE.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/farmer/products/{id}/status")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> updateProductStatus(
            Authentication authentication,
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> productService.updateProductStatus(user.getUserId(), id, status))
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Updated product status successfully.", updated)));
    }

    @Operation(summary = "Farmer deletes product", description = "Permanently removes product from stall catalog.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/farmer/products/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteProduct(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> productService.deleteProduct(user.getUserId(), id))
                .then(Mono.just(ResponseEntity.ok(ApiResponse.success("Deleted product successfully.", null))));
    }

    // ==========================================
    // 3. ADMIN ENDPOINTS (System Administration)
    // ==========================================

    @Operation(summary = "Admin moderates and bans violating product", description = "Administrator changes product status to BANNED or restores to AVAILABLE.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/admin/products/{id}/moderate")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> adminModerateProduct(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        return productService.adminModerateProduct(id, status)
                .map(mod -> ResponseEntity.ok(ApiResponse.success("Product moderation status updated successfully.", mod)));
    }
}
