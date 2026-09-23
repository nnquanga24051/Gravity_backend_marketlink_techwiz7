package com.gravity.marketlink.modules.auth.repository;

import com.gravity.marketlink.modules.auth.entity.Role;
import com.gravity.marketlink.modules.auth.entity.UserRole;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserRoleRepository extends R2dbcRepository<UserRole, Long> {

    @Query("SELECT r.role_id, r.role_name, r.description FROM roles r INNER JOIN user_roles ur ON r.role_id = ur.role_id WHERE ur.user_id = :userId")
    Flux<Role> findRolesByUserId(Long userId);

    @Query("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)")
    Mono<Void> insertUserRole(Long userId, Integer roleId);

    @Query("DELETE FROM user_roles WHERE user_id = :userId AND role_id = :roleId")
    Mono<Void> deleteUserRole(Long userId, Integer roleId);
}
