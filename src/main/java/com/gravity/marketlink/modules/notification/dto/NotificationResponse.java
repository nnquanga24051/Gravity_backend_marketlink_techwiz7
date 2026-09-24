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
public class NotificationResponse {

    private Long notificationId;
    private Long userId;
    private String title;
    private String message;
    private String type;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
