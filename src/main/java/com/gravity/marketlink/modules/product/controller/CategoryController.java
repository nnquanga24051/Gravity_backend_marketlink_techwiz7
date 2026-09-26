package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.product.dto.CategoryRequest;
import com.gravity.marketlink.modules.product.entity.Category;
import com.gravity.marketlink.modules.product.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Tag(name = "2. Danh mục sản phẩm (Categories)", description = "Các API truy xuất và quản lý danh mục hàng hóa, nông sản")
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Operation(summary = "Lấy tất cả danh mục", description = "Trả về danh sách tất cả các danh mục sản phẩm (Public endpoint), hỗ trợ tìm kiếm theo từ khóa.")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<Category>>>> getAllCategories(
            @RequestParam(value = "keyword", required = false) String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return categoryRepository.findAll()
                .filter(c -> kw.isEmpty()
                        || (c.getName() != null && c.getName().toLowerCase().contains(kw))
                        || (c.getDescription() != null && c.getDescription().toLowerCase().contains(kw))
                        || (c.getSlug() != null && c.getSlug().toLowerCase().contains(kw)))
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh mục sản phẩm thành công.", list)));
    }

    @Operation(summary = "Xem chi tiết một danh mục theo ID", description = "Lấy thông tin của một danh mục cụ thể")
    @GetMapping("/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Category>>> getCategoryById(@PathVariable("id") Integer id) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id)))
                .map(cat -> ResponseEntity.ok(ApiResponse.success("Lấy thông tin danh mục thành công.", cat)));
    }

    @Operation(summary = "Admin tạo danh mục sản phẩm mới", description = "Yêu cầu quyền Quản trị viên (ROLE_ADMIN).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Category>>> createCategory(@Valid @RequestBody CategoryRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? toSlug(request.getSlug())
                : toSlug(request.getName());

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .build();

        return categoryRepository.save(category)
                .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Tạo danh mục sản phẩm thành công.", saved)));
    }

    @Operation(summary = "Admin cập nhật danh mục sản phẩm", description = "Yêu cầu quyền Quản trị viên (ROLE_ADMIN).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Category>>> updateCategory(
            @PathVariable("id") Integer id,
            @Valid @RequestBody CategoryRequest request) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id)))
                .flatMap(cat -> {
                    cat.setName(request.getName());
                    if (request.getSlug() != null && !request.getSlug().isBlank()) {
                        cat.setSlug(toSlug(request.getSlug()));
                    } else if (cat.getSlug() == null || cat.getSlug().isBlank()) {
                        cat.setSlug(toSlug(request.getName()));
                    }
                    cat.setDescription(request.getDescription());
                    return categoryRepository.save(cat);
                })
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục sản phẩm thành công.", updated)));
    }

    @Operation(summary = "Admin xóa danh mục sản phẩm", description = "Yêu cầu quyền Quản trị viên (ROLE_ADMIN).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteCategory(@PathVariable("id") Integer id) {
        return categoryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id)))
                .flatMap(categoryRepository::delete)
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Xóa danh mục sản phẩm thành công.", null)));
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalized).replaceAll("");
        slug = NONLATIN.matcher(slug).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
