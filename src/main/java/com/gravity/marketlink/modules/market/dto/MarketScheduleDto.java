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
@Schema(description = "Lịch họp chợ trong tuần")
public class MarketScheduleDto {

    @Schema(description = "Mã lịch họp chợ", example = "1")
    private Long scheduleId;

    @NotNull(message = "Ngày trong tuần không được để trống")
    @Min(value = 1, message = "Ngày trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    @Max(value = 7, message = "Ngày trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    @Schema(description = "Ngày trong tuần (1: Thứ 2, ..., 6: Thứ 7, 7: Chủ nhật)", example = "6")
    private Integer dayOfWeek;

    @NotNull(message = "Giờ mở cửa không được để trống")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Giờ mở sạp chợ (HH:mm hoặc HH:mm:ss)", example = "06:00")
    private LocalTime openTime;

    @NotNull(message = "Giờ đóng cửa không được để trống")
    @JsonFormat(pattern = "HH:mm[:ss]")
    @Schema(description = "Giờ kết thúc phiên chợ (HH:mm hoặc HH:mm:ss)", example = "12:00")
    private LocalTime closeTime;
}
