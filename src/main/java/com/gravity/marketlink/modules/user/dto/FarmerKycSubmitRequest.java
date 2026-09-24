package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu nộp hồ sơ định danh KYC của Nông dân")
public class FarmerKycSubmitRequest {

    @NotEmpty(message = "Danh sách tài liệu KYC không được rỗng")
    @Valid
    @Schema(description = "Danh sách các tài liệu KYC đính kèm")
    private List<FarmerKycItemRequest> documents;
}
