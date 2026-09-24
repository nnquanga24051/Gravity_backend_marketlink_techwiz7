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

@Tag(name = "4. Sản phẩm & Nông sản (Products)", description = "Các API tìm kiếm, duyệt sản phẩm cho khách hàng và quản lý sản phẩm cho Nông dân")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    // ==========================================
    // 1. PUBLIC ENDPOINTS (Khách hàng & Người dùng)
    // ==========================================

    @Operation(summary = "Tìm kiếm & duyệt danh sách nông sản", description = "Lọc sản phẩm theo danh mục (categoryId), theo nông dân (farmerId) hoặc trạng thái.")
    @GetMapping("/products")
    public Mono<ResponseEntity<ApiResponse<List<ProductResponse>>>> getAllProducts(
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "farmerId", required = false) Long farmerId,
            @RequestParam(value = "status", required = false, defaultValue = "AVAILABLE") String status) {
        return productService.getAllProducts(categoryId, farmerId, status)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm thành công.", list)));
    }

    @Operation(summary = "Xem chi tiết một sản phẩm", description = "Lấy đầy đủ thông tin mặt hàng, hình ảnh, đơn giá, tồn kho sẵn sàng đặt trước và sạp nông dân.")
    @GetMapping("/products/{id}")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> getProductById(@PathVariable("id") Long id) {
        return productService.getProductById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.success("Lấy chi tiết sản phẩm thành công.", p)));
    }

    // ==========================================
    // 2. FARMER ENDPOINTS (Dành cho Nông dân)
    // ==========================================

    @Operation(summary = "Nông dân xem danh sách sản phẩm của gian hàng", description = "Yêu cầu quyền ROLE_FARMER. Trả về toàn bộ các mặt hàng thuộc sạp của nông dân.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/farmer/products")
    public Mono<ResponseEntity<ApiResponse<List<ProductResponse>>>> getMyProducts(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> productService.getFarmerProducts(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm của nông dân thành công.", list)));
    }

    @Operation(summary = "Nông dân đăng bán sản phẩm mới", description = "Yêu cầu quyền ROLE_FARMER và tài khoản nông dân đã được duyệt KYC (is_approved = true).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/farmer/products")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> createProduct(
            Authentication authentication,
            @Valid @RequestBody ProductCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> productService.createProduct(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Đăng bán sản phẩm mới thành công.", created)));
    }

    @Operation(summary = "Nông dân chỉnh sửa thông tin & tồn kho sản phẩm", description = "Yêu cầu quyền ROLE_FARMER. Cho phép sửa đơn giá, số lượng tồn kho đặt trước, ảnh và mô tả.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> productService.updateProduct(user.getUserId(), id, request))
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin sản phẩm thành công.", updated)));
    }

    @Operation(summary = "Nông dân đổi trạng thái bán hàng", description = "Đổi trạng thái sản phẩm: AVAILABLE, SOLD_OUT, hoặc TEMPORARILY_UNAVAILABLE.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> productService.updateProductStatus(user.getUserId(), id, status))
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái sản phẩm thành công.", updated)));
    }

    @Operation(summary = "Nông dân xóa sản phẩm", description = "Gỡ bỏ hoàn toàn sản phẩm khỏi danh mục gian hàng.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/farmer/products/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteProduct(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> productService.deleteProduct(user.getUserId(), id))
                .then(Mono.just(ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm thành công.", null))));
    }

    // ==========================================
    // 3. ADMIN ENDPOINTS (Dành cho Quản trị viên)
    // ==========================================

    @Operation(summary = "Admin kiểm duyệt & khóa mặt hàng vi phạm", description = "Quản trị viên đổi trạng thái sản phẩm thành BANNED hoặc mở lại AVAILABLE.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/admin/products/{id}/moderate")
    public Mono<ResponseEntity<ApiResponse<ProductResponse>>> adminModerateProduct(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        return productService.adminModerateProduct(id, status)
                .map(mod -> ResponseEntity.ok(ApiResponse.success("Đã kiểm duyệt trạng thái sản phẩm thành công.", mod)));
    }
}
