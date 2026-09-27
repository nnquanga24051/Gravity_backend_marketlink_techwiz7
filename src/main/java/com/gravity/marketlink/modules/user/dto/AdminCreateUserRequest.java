package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu tạo mới tài khoản người dùng từ trang Quản trị viên")
public class AdminCreateUserRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Schema(description = "Họ và tên người dùng", example = "Trần Văn Nông")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Schema(description = "Email đăng nhập", example = "farmer.tran@marketlink.vn")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    @Schema(description = "Mật khẩu đăng nhập", example = "MarketLink@123")
    private String password;

    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    private String phoneNumber;

    @NotBlank(message = "Vai trò không được để trống")
    @Schema(description = "Vai trò người dùng (CUSTOMER, FARMER, ADMIN)", example = "FARMER")
    private String role;

    @Schema(description = "Trạng thái tài khoản (ACTIVE, SUSPENDED)", example = "ACTIVE")
    private String status;

    @Schema(description = "Địa chỉ liên hệ / giao hàng", example = "Thạch Thất, Hà Nội")
    private String address;

    // Các trường đặc thù nếu tạo Nông dân (FARMER)
    @Schema(description = "Tên nông trại / gian hàng sạp", example = "HTX Nông Sản Xanh Ba Vì")
    private String farmName;

    @Schema(description = "Địa chỉ nông trại / cơ sở sản xuất", example = "Vân Hòa, Ba Vì, Hà Nội")
    private String farmAddress;

    @Schema(description = "Trạng thái thẩm định KYC ban đầu (UNVERIFIED, PENDING, VERIFIED)", example = "VERIFIED")
    private String kycStatus;
}
