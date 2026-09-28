package com.gravity.marketlink.modules.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "3. Role-Based Access Control (RBAC) Testing", description = "APIs for testing role-based access permissions (ADMIN, FARMER, CUSTOMER)")
@RestController
public class TestRbacController {

    @Operation(summary = "Farmer Dashboard", description = "Accessible only by accounts with ROLE_FARMER")
    @GetMapping("/api/farmer/dashboard")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Map<String, Object>> getFarmerDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_FARMER",
                "message", "Welcome to Farmer Dashboard! You have permissions to manage products and market session inventory."
        ));
    }

    @Operation(summary = "Customer Profile Summary", description = "Accessible only by accounts with ROLE_CUSTOMER")
    @GetMapping("/api/customer/profile-summary")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> getCustomerProfileSummary() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_CUSTOMER",
                "message", "Welcome Customer! You have permissions to pre-order fresh produce and select pickup time slots (Pay-at-pickup)."
        ));
    }

    @Operation(summary = "System Status (Admin)", description = "Accessible only by accounts with ROLE_ADMIN")
    @GetMapping("/api/admin/system-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminSystemStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_ADMIN",
                "message", "MarketLink Administrator Zone: Review farmer KYC documents and manage farmers markets."
        ));
    }
}
