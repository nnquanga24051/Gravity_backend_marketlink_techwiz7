package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.modules.product.entity.Category;
import com.gravity.marketlink.modules.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public Flux<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}
