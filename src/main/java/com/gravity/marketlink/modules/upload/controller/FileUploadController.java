package com.gravity.marketlink.modules.upload.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.upload.dto.FileUploadResponse;
import com.gravity.marketlink.modules.upload.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "8. Tải Lên Tập Tin & Ảnh (File & Image Upload)", description = "Các API tải ảnh từ thiết bị lên máy chủ (ảnh chợ, ảnh nông sản, ảnh đại diện, hồ sơ chứng nhận KYC)")
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @Operation(summary = "Tải một ảnh từ thiết bị lên máy chủ", description = "Nhận tệp tin ảnh từ thiết bị qua định dạng multipart/form-data. Trả về đường dẫn URL an toàn để lưu vào cơ sở dữ liệu.")
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadImage(
            @Parameter(description = "Tệp ảnh từ máy (JPG, PNG, WEBP, GIF, SVG)", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Thư mục phân loại ảnh (markets, products, avatars, kyc, general)", example = "markets")
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder) {

        FileUploadResponse response = fileUploadService.saveImage(file, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tải ảnh lên máy chủ thành công.", response));
    }

    @Operation(summary = "Tải nhiều ảnh cùng lúc từ thiết bị", description = "Hỗ trợ tải danh sách nhiều ảnh cùng lúc cho bộ sưu tập nông sản hoặc hồ sơ KYC.")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> uploadMultipleImages(
            @Parameter(description = "Danh sách các tệp ảnh từ máy", required = true)
            @RequestParam("files") List<MultipartFile> files,
            @Parameter(description = "Thư mục phân loại ảnh", example = "products")
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder) {

        List<FileUploadResponse> responses = fileUploadService.saveMultipleImages(files, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tải lên danh sách ảnh thành công.", responses));
    }
}
