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
@Schema(description = "Phản hồi kết quả tải ảnh / tệp tin lên máy chủ")
public class FileUploadResponse {

    @Schema(description = "Đường dẫn tương đối của ảnh để lưu trữ vào cơ sở dữ liệu", example = "/uploads/images/markets/market_20260925_012830_a8f9.jpg")
    private String url;

    @Schema(description = "Đường dẫn tuyệt đối kèm tên miền để hiển thị nhanh", example = "http://localhost:8081/uploads/images/markets/market_20260925_012830_a8f9.jpg")
    private String fullUrl;

    @Schema(description = "Tên tệp gốc từ thiết bị người dùng", example = "cho_nong_san_can_tho.jpg")
    private String originalFilename;

    @Schema(description = "Tên tệp đã được chuẩn hóa và lưu trữ an toàn trên đĩa", example = "market_20260925_012830_a8f9.jpg")
    private String storedFilename;

    @Schema(description = "Kích thước tệp tin (bytes)", example = "245890")
    private Long size;

    @Schema(description = "Định dạng MIME Type của ảnh", example = "image/jpeg")
    private String contentType;

    @Schema(description = "Thời gian tải lên thành công")
    private LocalDateTime uploadedAt;
}
