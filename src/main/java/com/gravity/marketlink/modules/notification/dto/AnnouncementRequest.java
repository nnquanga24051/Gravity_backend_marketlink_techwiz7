package com.gravity.marketlink.modules.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRequest {

    @NotBlank(message = "Tiêu đề thông báo không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thông báo không được để trống")
    private String content;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private String type = "GENERAL";

    @Builder.Default
    private String targetRole = "ALL";

    @Builder.Default
    private String priority = "NORMAL";
}
