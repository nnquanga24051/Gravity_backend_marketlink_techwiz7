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

    private String title;

    private String content;

    @Column("target_audience")
    @Builder.Default
    private String targetAudience = "ALL"; // ALL, FARMERS_ONLY, CUSTOMERS_ONLY

    @Column("start_date")
    private LocalDateTime startDate;

    @Column("end_date")
    private LocalDateTime endDate;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column("created_by")
    private Long createdBy;

    @Column("created_at")
    private LocalDateTime createdAt;
}
