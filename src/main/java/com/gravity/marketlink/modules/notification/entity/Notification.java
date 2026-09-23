package com.gravity.marketlink.modules.notification.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("notifications")
public class Notification {

    @Id
    @Column("notification_id")
    private Long notificationId;

    @Column("user_id")
    private Long userId;

    private String title;

    private String message;

    @Column("notification_type")
    private String notificationType; // ORDER_STATUS, MARKET_REMINDER, SYSTEM_ALERT, FAMILY_INVITE

    @Column("reference_id")
    private Long referenceId;

    @Column("is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
