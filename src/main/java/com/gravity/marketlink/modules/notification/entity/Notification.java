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

    @Column("title")
    private String title;

    @Column("message")
    private String message;

    @Column("type")
    private String type; // ORDER_PLACED, ORDER_ACCEPTED, ORDER_READY, RESTOCK_ALERT, KYC_UPDATE, SYSTEM

    @Column("reference_id")
    private Long referenceId;

    @Column("is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
