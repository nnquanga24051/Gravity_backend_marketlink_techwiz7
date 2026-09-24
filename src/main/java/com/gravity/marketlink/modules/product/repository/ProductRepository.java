package com.gravity.marketlink.modules.product.repository;

import com.gravity.marketlink.modules.product.entity.Product;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface ProductRepository extends R2dbcRepository<Product, Long> {

    Flux<Product> findByFarmerId(Long farmerId);

    Flux<Product> findByFarmerIdAndStatus(Long farmerId, String status);

    Flux<Product> findByCategoryIdAndStatus(Integer categoryId, String status);

    Flux<Product> findByStatus(String status);

    @Modifying
    @Query("UPDATE products SET current_stock = :stock, updated_at = :now WHERE product_id = :productId")
    Mono<Integer> updateStock(@Param("productId") Long productId, @Param("stock") BigDecimal stock, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE products SET status = :status, updated_at = :now WHERE product_id = :productId")
    Mono<Integer> updateStatus(@Param("productId") Long productId, @Param("status") String status, @Param("now") LocalDateTime now);
}
