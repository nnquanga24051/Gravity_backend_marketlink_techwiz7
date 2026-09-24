package com.gravity.marketlink.modules.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("farmer_profiles")
public class FarmerProfile {

    @Id
    @Column("farmer_id")
    private Long farmerId;

    @Column("stall_name")
    private String stallName;

    private String bio;

    @Column("farm_address")
    private String farmAddress;

    private java.math.BigDecimal latitude;

    private java.math.BigDecimal longitude;

    @Column("is_approved")
    @Builder.Default
    private Boolean isApproved = false;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
