package com.gravity.marketlink.modules.market.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("market_schedules")
public class MarketSchedule {

    @Id
    @Column("schedule_id")
    private Long scheduleId;

    @Column("market_id")
    private Long marketId;

    @Column("day_of_week")
    private Integer dayOfWeek; // 1 = Sunday, 2 = Monday, etc.

    @Column("start_time")
    private LocalTime startTime;

    @Column("end_time")
    private LocalTime endTime;
}
