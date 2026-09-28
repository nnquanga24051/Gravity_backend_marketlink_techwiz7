package com.gravity.marketlink.modules.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCreateRequest {

    @NotNull(message = "Please select designated market session / stall to sell product")
    private Long marketId;

    private String stallNumber;

    @NotNull(message = "Product category cannot be null")
    private Integer categoryId;

    @NotBlank(message = "Product name cannot be blank")
    private String name;

    private String description;

    @NotBlank(message = "Unit of measurement cannot be blank (e.g. kg, bunch, box)")
    private String unit;

    @NotNull(message = "Unit price cannot be null")
    @DecimalMin(value = "0.0", inclusive = false, message = "Unit price must be greater than 0")
    private BigDecimal price;

    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    private String imageUrl;
}
