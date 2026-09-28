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
@Schema(description = "Farmer KYC verification submission request")
public class FarmerKycSubmitRequest {

    @NotEmpty(message = "KYC document list cannot be empty")
    @Valid
    @Schema(description = "List of attached KYC documents")
    private List<FarmerKycItemRequest> documents;
}
