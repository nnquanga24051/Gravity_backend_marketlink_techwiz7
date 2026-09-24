package com.gravity.marketlink.modules.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
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
    private String documentType; // CITIZEN_ID_FRONT, CITIZEN_ID_BACK, BUSINESS_REGISTRATION, FOOD_SAFETY_CERT, ORGANIC_VIETGAP_CERT, FARM_PHOTO

    @Column("document_url")
    private String documentUrl;

    @Column("document_number")
    private String documentNumber;

    @Column("issued_date")
    private LocalDate issuedDate;

    @Column("expiry_date")
    private LocalDate expiryDate;

    @Column("created_at")
    private LocalDateTime createdAt;
}
