package com.gravity.marketlink.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerCutoffSettingResponse {

    private Long settingId;
    private Long farmerId;
    private Long marketId;
    private String marketName;
    private Integer dayOfWeek;
    private Integer cutoffHoursBefore;
}
