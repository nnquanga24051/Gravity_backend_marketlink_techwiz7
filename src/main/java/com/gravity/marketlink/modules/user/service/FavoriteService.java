package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.repository.MarketRepository;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import com.gravity.marketlink.modules.user.dto.FavoriteRequest;
import com.gravity.marketlink.modules.user.dto.FavoriteResponse;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.entity.Favorite;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import com.gravity.marketlink.modules.user.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final MarketRepository marketRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;

    public Flux<FavoriteResponse> getFavorites(Long customerId, String targetType) {
        Flux<Favorite> favFlux;
        if (targetType != null && !targetType.isBlank()) {
            favFlux = favoriteRepository.findByCustomerIdAndTargetType(customerId, targetType.toUpperCase());
        } else {
            favFlux = favoriteRepository.findByCustomerId(customerId);
        }

        return favFlux.flatMap(this::enrichFavorite);
    }

    public Mono<Boolean> isFavorite(Long customerId, String targetType, Long targetId) {
        return favoriteRepository.existsByCustomerIdAndTargetTypeAndTargetId(customerId, targetType.toUpperCase(), targetId);
    }

    @Transactional
    public Mono<FavoriteResponse> addFavorite(Long customerId, FavoriteRequest request) {
        String type = request.getTargetType().toUpperCase().trim();
        if (!List.of("FARMER", "PRODUCT", "MARKET").contains(type)) {
            return Mono.error(new IllegalArgumentException("Invalid favorite type (FARMER, PRODUCT, MARKET)."));
        }

        return favoriteRepository.existsByCustomerIdAndTargetTypeAndTargetId(customerId, type, request.getTargetId())
                .flatMap(exists -> {
                    if (exists) {
                        return favoriteRepository.findByCustomerIdAndTargetType(customerId, type)
                                .filter(f -> f.getTargetId().equals(request.getTargetId()))
                                .next()
                                .flatMap(this::enrichFavorite);
                    }

                    Favorite fav = Favorite.builder()
                            .customerId(customerId)
                            .targetType(type)
                            .targetId(request.getTargetId())
                            .createdAt(LocalDateTime.now())
                            .build();

                    return favoriteRepository.save(fav)
                            .flatMap(this::enrichFavorite);
                });
    }

    @Transactional
    public Mono<Void> removeFavorite(Long customerId, String targetType, Long targetId) {
        return favoriteRepository.deleteByCustomerIdAndTargetTypeAndTargetId(customerId, targetType.toUpperCase(), targetId);
    }

    private Mono<FavoriteResponse> enrichFavorite(Favorite fav) {
        String type = fav.getTargetType();
        Long id = fav.getTargetId();

        if ("PRODUCT".equalsIgnoreCase(type)) {
            return productRepository.findById(id)
                    .defaultIfEmpty(Product.builder().name("Product #" + id).price(java.math.BigDecimal.ZERO).unit("").build())
                    .map(p -> FavoriteResponse.builder()
                            .favoriteId(fav.getFavoriteId())
                            .customerId(fav.getCustomerId())
                            .targetType(type)
                            .targetId(id)
                            .targetTitle(p.getName())
                            .targetSubtitle(String.format("%,.0f VND / %s", p.getPrice(), p.getUnit()))
                            .targetImageUrl(p.getImageUrl())
                            .createdAt(fav.getCreatedAt())
                            .build());
        } else if ("MARKET".equalsIgnoreCase(type)) {
            return marketRepository.findById(id)
                    .defaultIfEmpty(Market.builder().name("Market #" + id).address("").build())
                    .map(m -> FavoriteResponse.builder()
                            .favoriteId(fav.getFavoriteId())
                            .customerId(fav.getCustomerId())
                            .targetType(type)
                            .targetId(id)
                            .targetTitle(m.getName())
                            .targetSubtitle(m.getAddress())
                            .targetImageUrl(m.getImageUrl())
                            .createdAt(fav.getCreatedAt())
                            .build());
        } else if ("FARMER".equalsIgnoreCase(type)) {
            Mono<FarmerProfile> profileMono = farmerProfileRepository.findById(id)
                    .defaultIfEmpty(FarmerProfile.builder().stallName("Farmer Stall #" + id).farmAddress("").build());
            Mono<User> userMono = userRepository.findById(id)
                    .defaultIfEmpty(User.builder().fullName("Farmer").avatarUrl("").build());

            return Mono.zip(profileMono, userMono)
                    .map(tuple -> {
                        FarmerProfile fp = tuple.getT1();
                        User u = tuple.getT2();
                        return FavoriteResponse.builder()
                                .favoriteId(fav.getFavoriteId())
                                .customerId(fav.getCustomerId())
                                .targetType(type)
                                .targetId(id)
                                .targetTitle(fp.getStallName())
                                .targetSubtitle(u.getFullName() + " - " + (fp.getFarmAddress() != null ? fp.getFarmAddress() : ""))
                                .targetImageUrl(u.getAvatarUrl())
                                .createdAt(fav.getCreatedAt())
                                .build();
                    });
        }

        return Mono.just(FavoriteResponse.builder()
                .favoriteId(fav.getFavoriteId())
                .customerId(fav.getCustomerId())
                .targetType(type)
                .targetId(id)
                .targetTitle("Favorite item #" + id)
                .createdAt(fav.getCreatedAt())
                .build());
    }
}
