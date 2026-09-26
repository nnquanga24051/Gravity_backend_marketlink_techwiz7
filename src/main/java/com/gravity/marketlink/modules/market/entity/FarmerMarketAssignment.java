package com.gravity.marketlink.modules.market.entity;

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
@Table("farmer_market_assignments")
public class FarmerMarketAssignment {

    @Id
    @Column("assignment_id")
    private Long assignmentId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("market_id")
    private Long marketId;

    @Column("stall_number")
    private String stallNumber;

    @Builder.Default
    private String status = "ACTIVE"; // REGISTERED, ACTIVE, REVOKED

    @Column("created_at")
    private LocalDateTime createdAt;

    @org.springframework.data.annotation.Transient
    private String marketName;

    @org.springframework.data.annotation.Transient
    private String marketAddress;
}
