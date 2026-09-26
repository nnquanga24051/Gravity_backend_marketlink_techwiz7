package com.gravity.marketlink.modules.upload.service;

import com.gravity.marketlink.modules.upload.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8081}")
    private String baseUrl;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"
    );

    /**
     * Lưu trữ một tệp ảnh từ MultipartFile từ máy người dùng
     */
    public FileUploadResponse saveImage(MultipartFile file, String folder) {
        if (file == null || file.isEmpty() || !StringUtils.hasText(file.getOriginalFilename())) {
            throw new IllegalArgumentException("Tệp tin tải lên rỗng hoặc không hợp lệ.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFilename).toLowerCase();

        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Định dạng tệp không được hỗ trợ: ." + extension + ". Chỉ chấp nhận các tệp ảnh: " + String.join(", ", ALLOWED_IMAGE_EXTENSIONS)
            );
        }

        // Sanitize sub-folder (default: general)
        String safeFolder = (StringUtils.hasText(folder) && folder.matches("^[a-zA-Z0-9_-]+$"))
                ? folder.toLowerCase()
                : "general";

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        String storedFilename = safeFolder + "_" + timestamp + "_" + randomSuffix + "." + extension;

        Path targetDir = Paths.get(uploadDir, "images", safeFolder).toAbsolutePath();
        Path targetPath = targetDir.resolve(storedFilename);

        try {
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Ghi file ra ổ đĩa
            file.transferTo(targetPath.toFile());

            long size = file.getSize();
            if (size <= 0 && Files.exists(targetPath)) {
                size = Files.size(targetPath);
            }

            String relativeUrl = "/uploads/images/" + safeFolder + "/" + storedFilename;
            String fullUrl = baseUrl.replaceAll("/+$", "") + relativeUrl;
            String contentType = file.getContentType() != null ? file.getContentType() : "image/" + extension;

            log.info("Đã lưu ảnh tải lên thành công: {} ({} KB) -> {}", originalFilename, size / 1024, relativeUrl);

            return FileUploadResponse.builder()
                    .url(relativeUrl)
                    .fullUrl(fullUrl)
                    .originalFilename(originalFilename)
                    .storedFilename(storedFilename)
                    .size(size)
                    .contentType(contentType)
                    .uploadedAt(LocalDateTime.now())
                    .build();

        } catch (IOException e) {
            log.error("Lỗi khi lưu tệp ảnh lên ổ đĩa: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể lưu trữ tệp ảnh: " + e.getMessage(), e);
        }
    }

    /**
     * Lưu trữ danh sách nhiều ảnh cùng lúc
     */
    public List<FileUploadResponse> saveMultipleImages(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<FileUploadResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                responses.add(saveImage(file, folder));
            }
        }
        return responses;
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}
