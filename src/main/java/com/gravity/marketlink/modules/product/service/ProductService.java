package com.gravity.marketlink.modules.product.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.product.dto.ProductCreateRequest;
import com.gravity.marketlink.modules.product.dto.ProductResponse;
import com.gravity.marketlink.modules.product.dto.ProductUpdateRequest;
import com.gravity.marketlink.modules.product.entity.Category;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.repository.CategoryRepository;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public Flux<ProductResponse> getAllProducts(Integer categoryId, Long farmerId, String status) {
        String queryStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase() : "AVAILABLE";

        Flux<Product> productsFlux;
        if (farmerId != null) {
            productsFlux = productRepository.findByFarmerId(farmerId);
        } else if (categoryId != null) {
            productsFlux = productRepository.findByCategoryIdAndStatus(categoryId, queryStatus);
        } else {
            productsFlux = productRepository.findByStatus(queryStatus);
        }

        return productsFlux
                .filter(p -> !"BANNED".equalsIgnoreCase(p.getStatus()))
                .flatMap(this::enrichProductResponse);
    }

    public Flux<ProductResponse> getFarmerProducts(Long farmerId) {
        return productRepository.findByFarmerId(farmerId)
                .flatMap(this::enrichProductResponse);
    }

    public Mono<ProductResponse> getProductById(Long productId) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId)))
                .flatMap(this::enrichProductResponse);
    }

    @Transactional
    public Mono<ProductResponse> createProduct(Long farmerId, ProductCreateRequest request) {
        return farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin sạp nông dân với ID: " + farmerId)))
                .flatMap(profile -> {
                    if (Boolean.FALSE.equals(profile.getIsApproved())) {
                        return Mono.error(new IllegalStateException("Hồ sơ Nông dân chưa được Quản trị viên duyệt KYC. Bạn chưa có quyền đăng bán sản phẩm."));
                    }

                    return categoryRepository.findById(request.getCategoryId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Danh mục không tồn tại với ID: " + request.getCategoryId())))
                            .flatMap(category -> {
                                Product product = Product.builder()
                                        .farmerId(farmerId)
                                        .categoryId(request.getCategoryId())
                                        .name(request.getName().trim())
                                        .description(request.getDescription())
                                        .unit(request.getUnit().trim())
                                        .price(request.getPrice())
                                        .currentStock(request.getCurrentStock() != null ? request.getCurrentStock() : java.math.BigDecimal.ZERO)
                                        .imageUrl(request.getImageUrl())
                                        .status("AVAILABLE")
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return productRepository.save(product)
                                        .doOnSuccess(saved -> log.info("Nông dân [{}] đã tạo sản phẩm mới [{}] (ID: {})", farmerId, saved.getName(), saved.getProductId()))
                                        .flatMap(this::enrichProductResponse);
                            });
                });
    }

    @Transactional
    public Mono<ProductResponse> updateProduct(Long farmerId, Long productId, ProductUpdateRequest request) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền chỉnh sửa sản phẩm của nhà vườn khác."));
                    }

                    if (request.getCategoryId() != null) product.setCategoryId(request.getCategoryId());
                    if (request.getName() != null && !request.getName().isBlank()) product.setName(request.getName().trim());
                    if (request.getDescription() != null) product.setDescription(request.getDescription());
                    if (request.getUnit() != null && !request.getUnit().isBlank()) product.setUnit(request.getUnit().trim());
                    if (request.getPrice() != null) product.setPrice(request.getPrice());
                    if (request.getCurrentStock() != null) product.setCurrentStock(request.getCurrentStock());
                    if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
                    if (request.getStatus() != null && !request.getStatus().isBlank()) product.setStatus(request.getStatus().trim().toUpperCase());

                    product.setUpdatedAt(LocalDateTime.now());

                    return productRepository.save(product)
                            .flatMap(this::enrichProductResponse);
                });
    }

    @Transactional
    public Mono<ProductResponse> updateProductStatus(Long farmerId, Long productId, String status) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền thay đổi trạng thái sản phẩm này."));
                    }

                    product.setStatus(status.trim().toUpperCase());
                    product.setUpdatedAt(LocalDateTime.now());

                    return productRepository.save(product)
                            .flatMap(this::enrichProductResponse);
                });
    }

    @Transactional
    public Mono<Void> deleteProduct(Long farmerId, Long productId) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền xóa sản phẩm này."));
                    }
                    return productRepository.delete(product);
                });
    }

    @Transactional
    public Mono<ProductResponse> adminModerateProduct(Long productId, String status) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId)))
                .flatMap(product -> {
                    product.setStatus(status.trim().toUpperCase());
                    product.setUpdatedAt(LocalDateTime.now());
                    return productRepository.save(product)
                            .doOnSuccess(saved -> log.warn("Admin đã thay đổi trạng thái sản phẩm [{}] thành [{}]", productId, status))
                            .flatMap(this::enrichProductResponse);
                });
    }

    private Mono<ProductResponse> enrichProductResponse(Product product) {
        Mono<Category> categoryMono = categoryRepository.findById(product.getCategoryId())
                .defaultIfEmpty(Category.builder().name("Khác").build());

        Mono<FarmerProfile> profileMono = farmerProfileRepository.findByFarmerId(product.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Nông trại #" + product.getFarmerId()).build());

        return Mono.zip(categoryMono, profileMono)
                .map(tuple -> {
                    Category cat = tuple.getT1();
                    FarmerProfile prof = tuple.getT2();

                    return ProductResponse.builder()
                            .productId(product.getProductId())
                            .farmerId(product.getFarmerId())
                            .farmerStallName(prof.getStallName())
                            .farmAddress(prof.getFarmAddress())
                            .categoryId(product.getCategoryId())
                            .categoryName(cat.getName())
                            .name(product.getName())
                            .description(product.getDescription())
                            .unit(product.getUnit())
                            .price(product.getPrice())
                            .currentStock(product.getCurrentStock())
                            .imageUrl(product.getImageUrl())
                            .status(product.getStatus())
                            .createdAt(product.getCreatedAt())
                            .updatedAt(product.getUpdatedAt())
                            .build();
                });
    }
}
