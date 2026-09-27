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
@Table("system_announcements")
public class SystemAnnouncement {

    @Id
    @Column("announcement_id")
    private Long announcementId;

    @Column("admin_id")
    private Long adminId;

    @Column("title")
    private String title;

    @Column("content")
    private String content;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column("published_at")
    private LocalDateTime publishedAt;

    @Column("type")
    @Builder.Default
    private String type = "GENERAL";

    @Column("target_role")
    @Builder.Default
    private String targetRole = "ALL";

    @Column("priority")
    @Builder.Default
    private String priority = "NORMAL";
}
