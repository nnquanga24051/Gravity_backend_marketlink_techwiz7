package com.gravity.marketlink.modules.product.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.market.repository.FarmerMarketAssignmentRepository;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
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
    private final MarketRepository marketRepository;
    private final FarmerMarketAssignmentRepository assignmentRepository;

    public Flux<ProductResponse> getAllProducts(Integer categoryId, Long farmerId, Long marketId, String stallNumber, String keyword, String status) {
        String queryStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase() : "AVAILABLE";
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";

        Flux<Product> productsFlux;
        if (farmerId != null && marketId != null) {
            productsFlux = productRepository.findByFarmerIdAndMarketIdAndStatus(farmerId, marketId, queryStatus);
        } else if (marketId != null) {
            productsFlux = productRepository.findByMarketIdAndStatus(marketId, queryStatus);
        } else if (farmerId != null) {
            productsFlux = productRepository.findByFarmerId(farmerId);
        } else if (categoryId != null) {
            productsFlux = productRepository.findByCategoryIdAndStatus(categoryId, queryStatus);
        } else {
            productsFlux = productRepository.findByStatus(queryStatus);
        }

        return productsFlux
                .filter(p -> !"BANNED".equalsIgnoreCase(p.getStatus()))
                .filter(p -> categoryId == null || categoryId.equals(p.getCategoryId()))
                .filter(p -> stallNumber == null || stallNumber.isBlank() || (p.getStallNumber() != null && p.getStallNumber().equalsIgnoreCase(stallNumber.trim())))
                .filter(p -> kw.isEmpty()
                        || (p.getName() != null && p.getName().toLowerCase().contains(kw))
                        || (p.getDescription() != null && p.getDescription().toLowerCase().contains(kw))
                        || (p.getStallNumber() != null && p.getStallNumber().toLowerCase().contains(kw)))
                .flatMap(this::enrichProductResponse);
    }

    public Flux<ProductResponse> getAllProducts(Integer categoryId, Long farmerId, Long marketId, String stallNumber, String status) {
        return getAllProducts(categoryId, farmerId, marketId, stallNumber, null, status);
    }

    public Flux<ProductResponse> getAllProducts(Integer categoryId, Long farmerId, String status) {
        return getAllProducts(categoryId, farmerId, null, null, null, status);
    }

    public Flux<ProductResponse> searchProducts(String keyword, Integer categoryId) {
        return getAllProducts(categoryId, null, null, null, keyword, "AVAILABLE");
    }

    public Flux<ProductResponse> getFarmerProducts(Long farmerId, String keyword, Integer categoryId, Long marketId, String status) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return productRepository.findByFarmerId(farmerId)
                .filter(p -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim()) || p.getStatus().equalsIgnoreCase(status.trim()))
                .filter(p -> categoryId == null || categoryId.equals(p.getCategoryId()))
                .filter(p -> marketId == null || marketId.equals(p.getMarketId()))
                .filter(p -> kw.isEmpty()
                        || (p.getName() != null && p.getName().toLowerCase().contains(kw))
                        || (p.getDescription() != null && p.getDescription().toLowerCase().contains(kw))
                        || (p.getStallNumber() != null && p.getStallNumber().toLowerCase().contains(kw)))
                .flatMap(this::enrichProductResponse);
    }

    public Flux<ProductResponse> getFarmerProducts(Long farmerId) {
        return getFarmerProducts(farmerId, null, null, null, null);
    }

    public Mono<ProductResponse> getProductById(Long productId) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + productId)))
                .flatMap(this::enrichProductResponse);
    }

    @Transactional
    public Mono<ProductResponse> createProduct(Long farmerId, ProductCreateRequest request) {
        return farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer stall not found with ID: " + farmerId)))
                .flatMap(profile -> {
                    if (Boolean.FALSE.equals(profile.getIsApproved())) {
                        return Mono.error(new IllegalStateException("Farmer profile has not been KYC approved by Administrator. You cannot list products yet."));
                    }

                    // Validate market assignment
                    return assignmentRepository.findByFarmerIdAndMarketId(farmerId, request.getMarketId())
                            .switchIfEmpty(Mono.error(new IllegalArgumentException("You have not registered or do not have an active stall at this market. Please register for market participation before selling products.")))
                            .flatMap(assignment -> {
                                String stallNum = (request.getStallNumber() != null && !request.getStallNumber().isBlank())
                                        ? request.getStallNumber().trim()
                                        : assignment.getStallNumber();

                                return categoryRepository.findById(request.getCategoryId())
                                        .switchIfEmpty(Mono.error(new ResourceNotFoundException("Category does not exist with ID: " + request.getCategoryId())))
                                        .flatMap(category -> {
                                            Product product = Product.builder()
                                                    .farmerId(farmerId)
                                                    .marketId(request.getMarketId())
                                                    .stallNumber(stallNum)
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
                                                    .doOnSuccess(saved -> log.info("Farmer [{}] created new product [{}] assigned to stall [{}] at market [{}] (ID: {})",
                                                            farmerId, saved.getName(), saved.getStallNumber(), saved.getMarketId(), saved.getProductId()))
                                                    .flatMap(this::enrichProductResponse);
                                        });
                            });
                });
    }

    @Transactional
    public Mono<ProductResponse> updateProduct(Long farmerId, Long productId, ProductUpdateRequest request) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to edit another farmer's product."));
                    }

                    if (request.getCategoryId() != null) product.setCategoryId(request.getCategoryId());
                    if (request.getMarketId() != null) product.setMarketId(request.getMarketId());
                    if (request.getStallNumber() != null && !request.getStallNumber().isBlank()) product.setStallNumber(request.getStallNumber().trim());
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to change this product's status."));
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + productId)))
                .flatMap(product -> {
                    if (!product.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to delete this product."));
                    }
                    return productRepository.delete(product);
                });
    }

    @Transactional
    public Mono<ProductResponse> adminModerateProduct(Long productId, String status) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Product not found with ID: " + productId)))
                .flatMap(product -> {
                    product.setStatus(status.trim().toUpperCase());
                    product.setUpdatedAt(LocalDateTime.now());
                    return productRepository.save(product)
                            .doOnSuccess(saved -> log.warn("Admin updated product status [{}] to [{}]", productId, status))
                            .flatMap(this::enrichProductResponse);
                });
    }

    private Mono<ProductResponse> enrichProductResponse(Product product) {
        Mono<Category> categoryMono = categoryRepository.findById(product.getCategoryId())
                .defaultIfEmpty(Category.builder().name("Other").build());

        Mono<FarmerProfile> profileMono = farmerProfileRepository.findByFarmerId(product.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Farm #" + product.getFarmerId()).build());

        Mono<String> marketNameMono = product.getMarketId() != null
                ? marketRepository.findById(product.getMarketId()).map(m -> m.getName()).defaultIfEmpty("Farmers Market")
                : Mono.just("Farmers Market");

        return Mono.zip(categoryMono, profileMono, marketNameMono)
                .map(tuple -> {
                    Category cat = tuple.getT1();
                    FarmerProfile prof = tuple.getT2();
                    String marketName = tuple.getT3();

                    return ProductResponse.builder()
                            .productId(product.getProductId())
                            .farmerId(product.getFarmerId())
                            .farmerStallName(prof.getStallName())
                            .farmAddress(prof.getFarmAddress())
                            .marketId(product.getMarketId())
                            .marketName(marketName)
                            .stallNumber(product.getStallNumber())
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
