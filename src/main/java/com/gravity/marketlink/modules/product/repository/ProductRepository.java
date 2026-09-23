package com.gravity.marketlink.modules.product.repository;

import com.gravity.marketlink.modules.product.entity.Product;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ProductRepository extends R2dbcRepository<Product, Long> {
    Flux<Product> findByFarmerIdAndIsActiveTrue(Long farmerId);
    Flux<Product> findByCategoryIdAndIsActiveTrue(Integer categoryId);
    Flux<Product> findByIsActiveTrue();
}
