package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateRequest;
import com.gravity.marketlink.modules.product.dto.WeeklyStockTemplateResponse;
import com.gravity.marketlink.modules.product.service.StockTemplateService;
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

@Tag(name = "4. Tồn kho mẫu theo tuần (Weekly Stock Templates)", description = "Các API thiết lập định mức tồn kho tự động lặp lại theo thứ trong tuần cho nông dân")
@RestController
@RequestMapping(value = {"/api/farmer/stock-templates", "/api/farmer/weekly-stock"})
@RequiredArgsConstructor
public class StockTemplateController {

    private final StockTemplateService stockTemplateService;
    private final UserRepository userRepository;

    @Operation(summary = "Lấy danh sách định mức tồn kho mẫu của nông dân", description = "Lấy các cấu hình định mức lặp lại hàng tuần theo từng phiên chợ (marketId tùy chọn).")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<WeeklyStockTemplateResponse>>>> getTemplates(
            Authentication authentication,
            @RequestParam(value = "marketId", required = false) Long marketId) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> stockTemplateService.getTemplates(user.getUserId(), marketId).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách mẫu định mức tồn kho thành công.", list)));
    }

    @Operation(summary = "Thêm mới hoặc cập nhật định mức tồn kho mẫu", description = "Tạo mẫu phân bổ tồn kho tự động theo thứ (1: Thứ 2 ... 7: Chủ nhật) cho sản phẩm tại một chợ.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<WeeklyStockTemplateResponse>>> saveTemplate(
            Authentication authentication,
            @Valid @RequestBody WeeklyStockTemplateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> stockTemplateService.saveTemplate(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Lưu mẫu định mức tồn kho thành công.", res)));
    }

    @Operation(summary = "Xóa một mẫu định mức tồn kho", description = "Xóa cấu hình định mức tồn kho theo ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteTemplate(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> stockTemplateService.deleteTemplate(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Xóa mẫu định mức tồn kho thành công.", null)));
    }
}
