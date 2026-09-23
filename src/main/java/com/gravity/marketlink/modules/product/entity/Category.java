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
@Table("categories")
public class Category {

    @Id
    @Column("category_id")
    private Integer categoryId;

    private String name;

    private String slug;

    private String description;
}
