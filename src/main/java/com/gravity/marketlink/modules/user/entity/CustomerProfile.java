package com.gravity.marketlink.modules.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("customer_profiles")
public class CustomerProfile {

    @Id
    @Column("customer_id")
    private Long customerId;

    @Column("default_address")
    private String defaultAddress;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @Column("family_account_id")
    private Long familyAccountId;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
