package com.gravity.marketlink.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {

    private Long announcementId;
    private Long adminId;
    private String adminName;
    private String title;
    private String content;
    private Boolean isActive;
    private LocalDateTime publishedAt;
}
