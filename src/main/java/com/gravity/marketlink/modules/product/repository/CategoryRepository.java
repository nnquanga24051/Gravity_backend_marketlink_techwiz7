package com.gravity.marketlink.modules.product.repository;

import com.gravity.marketlink.modules.product.entity.Category;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface CategoryRepository extends R2dbcRepository<Category, Integer> {
    Mono<Category> findBySlug(String slug);
}
