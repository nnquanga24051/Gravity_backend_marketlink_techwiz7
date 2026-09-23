package com.gravity.marketlink.modules.product.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("farmer_cutoff_settings")
public class FarmerCutoffSetting {

    @Id
    @Column("setting_id")
    private Long settingId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("market_id")
    private Long marketId;

    @Column("day_of_week")
    private Integer dayOfWeek;

    @Column("cutoff_hours_before")
    @Builder.Default
    private Integer cutoffHoursBefore = 12;
}
