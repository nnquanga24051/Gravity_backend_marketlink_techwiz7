package com.gravity.marketlink.modules.upload.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response for uploaded file/image")
public class FileUploadResponse {

    @Schema(description = "Relative image path for database persistence", example = "/uploads/images/markets/market_20260925_012830_a8f9.jpg")
    private String url;

    @Schema(description = "Absolute URL path for immediate display", example = "http://localhost:8081/uploads/images/markets/market_20260925_012830_a8f9.jpg")
    private String fullUrl;

    @Schema(description = "Original file name from user device", example = "cho_nong_san_can_tho.jpg")
    private String originalFilename;

    @Schema(description = "Sanitized file name saved on server storage", example = "market_20260925_012830_a8f9.jpg")
    private String storedFilename;

    @Schema(description = "File size in bytes", example = "245890")
    private Long size;

    @Schema(description = "MIME type of the image", example = "image/jpeg")
    private String contentType;

    @Schema(description = "Upload completion timestamp")
    private LocalDateTime uploadedAt;
}
