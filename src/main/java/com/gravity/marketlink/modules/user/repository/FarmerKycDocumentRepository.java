package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.FarmerKycDocument;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FarmerKycDocumentRepository extends R2dbcRepository<FarmerKycDocument, Long> {

    Flux<FarmerKycDocument> findByFarmerId(Long farmerId);

    Mono<FarmerKycDocument> findByFarmerIdAndDocumentType(Long farmerId, String documentType);

    Mono<Void> deleteByFarmerIdAndDocumentType(Long farmerId, String documentType);
}
