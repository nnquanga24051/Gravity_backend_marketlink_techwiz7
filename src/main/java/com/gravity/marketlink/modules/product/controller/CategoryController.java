package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.modules.product.entity.Category;
import com.gravity.marketlink.modules.product.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@Tag(name = "2. Danh mục sản phẩm (Categories)", description = "Các API truy xuất danh mục hàng hóa, nông sản")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @Operation(summary = "Lấy tất cả danh mục", description = "Trả về danh sách tất cả các danh mục sản phẩm (Public endpoint)")
    @GetMapping
    public Flux<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}
