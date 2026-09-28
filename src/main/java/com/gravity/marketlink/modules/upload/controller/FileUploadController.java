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

@Tag(name = "8. File & Image Upload", description = "APIs for uploading images from device to server (markets, products, avatars, KYC documents)")
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @Operation(summary = "Upload a single image from device to server", description = "Receives image file via multipart/form-data. Returns secure URL path for database persistence.")
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadImage(
            @Parameter(description = "Image file from device (JPG, PNG, WEBP, GIF, SVG)", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Folder category for image (markets, products, avatars, kyc, general)", example = "markets")
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder) {

        FileUploadResponse response = fileUploadService.saveImage(file, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded to server successfully.", response));
    }

    @Operation(summary = "Upload multiple images at once", description = "Supports uploading multiple image files for product gallery or KYC certification documents.")
    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> uploadMultipleImages(
            @Parameter(description = "List of image files from device", required = true)
            @RequestParam("files") List<MultipartFile> files,
            @Parameter(description = "Folder category for images", example = "products")
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder) {

        List<FileUploadResponse> responses = fileUploadService.saveMultipleImages(files, folder);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Uploaded image list successfully.", responses));
    }
}
