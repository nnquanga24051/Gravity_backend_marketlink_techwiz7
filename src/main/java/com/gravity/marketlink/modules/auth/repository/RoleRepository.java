package com.gravity.marketlink.modules.auth.repository;

import com.gravity.marketlink.modules.auth.entity.Role;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface RoleRepository extends R2dbcRepository<Role, Integer> {
    Mono<Role> findByRoleName(String roleName);
}
