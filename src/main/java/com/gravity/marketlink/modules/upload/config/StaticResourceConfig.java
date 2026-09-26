package com.gravity.marketlink.modules.upload.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath();
            if (!Files.exists(root)) {
                Files.createDirectories(root);
                log.info("Đã tạo thư mục lưu trữ tập tin tải lên: {}", root);
            }
            // Sub-folders for organization
            Files.createDirectories(root.resolve("images").resolve("markets"));
            Files.createDirectories(root.resolve("images").resolve("products"));
            Files.createDirectories(root.resolve("images").resolve("avatars"));
            Files.createDirectories(root.resolve("images").resolve("kyc"));
            Files.createDirectories(root.resolve("images").resolve("general"));
        } catch (IOException e) {
            log.error("Không thể khởi tạo thư mục lưu trữ tải lên: {}", e.getMessage());
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path root = Paths.get(uploadDir).toAbsolutePath();
        String resourceLocation = root.toUri().toString();
        if (!resourceLocation.endsWith("/")) {
            resourceLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
    }
}
