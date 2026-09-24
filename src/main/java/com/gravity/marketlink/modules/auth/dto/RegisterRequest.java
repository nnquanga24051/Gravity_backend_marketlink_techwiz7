package com.gravity.marketlink.modules.auth.dto;

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
public class RegisterRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Schema(description = "Email đăng nhập", example = "farmer.bavi@marketlink.vn")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải chứa ít nhất 6 ký tự")
    @Schema(description = "Mật khẩu tài khoản (tối thiểu 6 ký tự)", example = "Farmer@123")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Schema(description = "Họ và tên chủ tài khoản", example = "Nguyễn Văn Nông Dân")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    private String phoneNumber;

    @NotBlank(message = "Vai trò không được để trống (FARMER hoặc CUSTOMER)")
    @Schema(description = "Vai trò: FARMER hoặc CUSTOMER", example = "FARMER")
    private String role; // FARMER, CUSTOMER

    // Farmer specific fields
    @Schema(description = "Tên nông trại / sạp hàng (chỉ dành cho FARMER)", example = "Nông Trại Ba Vì Xanh")
    private String farmName;

    @Schema(description = "Địa chỉ nông trại / vùng canh tác (chỉ dành cho FARMER)", example = "Xã Vân Hòa, Ba Vì, Hà Nội")
    private String farmAddress;

    // Customer specific fields
    @Schema(description = "Địa chỉ giao hàng mặc định (chỉ dành cho CUSTOMER)", example = "123 Cầu Giấy, Hà Nội")
    private String deliveryAddress;
}
