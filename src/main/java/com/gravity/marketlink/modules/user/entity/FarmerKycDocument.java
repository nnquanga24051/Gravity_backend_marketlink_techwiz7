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
@Table("farmer_kyc_documents")
public class FarmerKycDocument {

    @Id
    @Column("document_id")
    private Long documentId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("document_type")
    private String documentType;

    @Column("document_url")
    private String documentUrl;

    @Column("verification_status")
    @Builder.Default
    private String verificationStatus = "PENDING";

    @Column("uploaded_at")
    private LocalDateTime uploadedAt;

    @Column("verified_at")
    private LocalDateTime verifiedAt;

    @Column("verified_by")
    private Long verifiedBy;

    @Column("rejection_reason")
    private String rejectionReason;
}
