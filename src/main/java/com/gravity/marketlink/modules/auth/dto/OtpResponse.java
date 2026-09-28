package com.gravity.marketlink.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Result of OTP sending/verification")
public class OtpResponse {

    @Schema(description = "Success or failure status", example = "true")
    private Boolean success;

    @Schema(description = "Result message", example = "OTP code sent successfully.")
    private String message;

    @Schema(description = "OTP code (provided in test/dev environment)", example = "123456")
    private String devCode;
}
