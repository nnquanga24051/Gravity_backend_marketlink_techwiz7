package com.gravity.marketlink.modules.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "3. Kiểm thử phân quyền RBAC (Role-Based Access Control)", description = "Các API kiểm tra quyền truy cập theo từng Role (ADMIN, FARMER, CUSTOMER)")
@RestController
public class TestRbacController {

    @Operation(summary = "Dashboard Nông dân", description = "Chỉ cho phép tài khoản có ROLE_FARMER truy cập")
    @GetMapping("/api/farmer/dashboard")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Map<String, Object>> getFarmerDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_FARMER",
                "message", "Chào mừng đến trang quản trị của Nông Dân! Bạn có quyền quản lý sản phẩm và tồn kho phiên chợ."
        ));
    }

    @Operation(summary = "Tóm tắt hồ sơ Khách hàng", description = "Chỉ cho phép tài khoản có ROLE_CUSTOMER truy cập")
    @GetMapping("/api/customer/profile-summary")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, Object>> getCustomerProfileSummary() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_CUSTOMER",
                "message", "Chào mừng Khách Hàng! Bạn có quyền đặt trước nông sản và chọn khung giờ nhận hàng (Pay-at-pickup)."
        ));
    }

    @Operation(summary = "Trạng thái hệ thống (Admin)", description = "Chỉ cho phép tài khoản có ROLE_ADMIN truy cập")
    @GetMapping("/api/admin/system-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminSystemStatus() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "roleRequired", "ROLE_ADMIN",
                "message", "Khu vực Quản trị viên hệ thống MarketLink: Kiểm duyệt KYC nông dân và quản lý chợ phiên."
        ));
    }
}
