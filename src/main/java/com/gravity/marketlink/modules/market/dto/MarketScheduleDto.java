package com.gravity.marketlink.modules.market.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Weekly market session schedule")
public class MarketScheduleDto {

    @Schema(description = "Schedule ID", example = "1")
    private Long scheduleId;

    @NotNull(message = "Day of week cannot be null")
    @Min(value = 1, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    @Max(value = 7, message = "Day of week from 1 (Monday) to 7 (Sunday)")
    @Schema(description = "Day of week (1: Monday ... 7: Sunday)", example = "6")
    private Integer dayOfWeek;

    @NotNull(message = "Opening time cannot be null")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Market opening time (HH:mm or HH:mm:ss)", example = "06:00")
    private LocalTime openTime;

    @NotNull(message = "Closing time cannot be null")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Market closing time (HH:mm or HH:mm:ss)", example = "12:00")
    private LocalTime closeTime;
}
