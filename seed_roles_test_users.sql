-- ===================================================================
-- SCRIPT TẠO / CẬP NHẬT 3 TÀI KHOẢN TEST CHO 3 ROLE HỆ THỐNG MARKETLINK
-- Role 1: ADMIN      | Email: admin@marketlink.vn    | Password: Admin@123
-- Role 2: FARMER     | Email: farmer@marketlink.vn   | Password: Farmer@123
-- Role 3: CUSTOMER   | Email: customer@marketlink.vn | Password: Customer@123
-- ===================================================================

USE marketlink_db;

-- 1. Đảm bảo 3 Role cơ bản luôn tồn tại
INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống có toàn quyền'),
(2, 'FARMER', 'Nông dân bán hàng tại các sạp chợ'),
(3, 'CUSTOMER', 'Khách hàng đặt trước nông sản')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. Tài khoản 1: ADMIN
DELETE FROM `users` WHERE `email` = 'admin@marketlink.vn';
INSERT INTO `users` (
  `email`, `is_email_verified`, `password_hash`, `phone_number`, `is_phone_verified`, 
  `full_name`, `avatar_url`, `status`, `kyc_status`, `created_at`, `updated_at`
) VALUES (
  'admin@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', 
  '0900000001', 1, 'Quản Trị Viên Hệ Thống', 
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 
  'ACTIVE', 'VERIFIED', NOW(), NOW()
);
SET @admin_id = LAST_INSERT_ID();
DELETE FROM `user_roles` WHERE `user_id` = @admin_id;
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) VALUES (@admin_id, 1, NOW());

-- 3. Tài khoản 2: FARMER
DELETE FROM `users` WHERE `email` = 'farmer@marketlink.vn';
INSERT INTO `users` (
  `email`, `is_email_verified`, `password_hash`, `phone_number`, `is_phone_verified`, 
  `full_name`, `avatar_url`, `status`, `kyc_status`, `created_at`, `updated_at`
) VALUES (
  'farmer@marketlink.vn', 1, '$2a$10$hml.1wv/wuB3crC4jr2fiuk4Ic82LP2MtjPB2oyevzcKqRGlndtSy', 
  '0900000002', 1, 'Nguyễn Văn Nông Dân', 
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 
  'ACTIVE', 'VERIFIED', NOW(), NOW()
);
SET @farmer_id = LAST_INSERT_ID();
DELETE FROM `user_roles` WHERE `user_id` = @farmer_id;
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) VALUES (@farmer_id, 2, NOW());

-- Tạo hồ sơ FarmerProfile kèm quyền bán hàng is_approved = 1
INSERT INTO `farmer_profiles` (
  `farmer_id`, `stall_name`, `bio`, `farm_address`, `latitude`, `longitude`, `is_approved`, `created_at`, `updated_at`
) VALUES (
  @farmer_id, 'Nông Trại Hữu Cơ Ba Vì', 
  'Chuyên cung cấp rau củ quả hữu cơ, nấm sạch và trái cây theo mùa đạt chuẩn VietGAP', 
  'Thôn 2, Xã Vân Hòa, Huyện Ba Vì, Hà Nội', 
  21.08210000, 105.35820000, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
  `stall_name` = VALUES(`stall_name`), 
  `is_approved` = 1,
  `updated_at` = NOW();

-- 4. Tài khoản 3: CUSTOMER
DELETE FROM `users` WHERE `email` = 'customer@marketlink.vn';
INSERT INTO `users` (
  `email`, `is_email_verified`, `password_hash`, `phone_number`, `is_phone_verified`, 
  `full_name`, `avatar_url`, `status`, `kyc_status`, `created_at`, `updated_at`
) VALUES (
  'customer@marketlink.vn', 1, '$2a$10$WDjcahbaoquAsYwfYe/R7uRFytfi4jPyhjR3s0N0BL0Qa2uivKage', 
  '0900000003', 1, 'Trần Thị Khách Hàng', 
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 
  'ACTIVE', 'UNVERIFIED', NOW(), NOW()
);
SET @customer_id = LAST_INSERT_ID();
DELETE FROM `user_roles` WHERE `user_id` = @customer_id;
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) VALUES (@customer_id, 3, NOW());

-- Tạo hồ sơ CustomerProfile
INSERT INTO `customer_profiles` (
  `customer_id`, `default_address`, `latitude`, `longitude`, `family_account_id`, `created_at`, `updated_at`
) VALUES (
  @customer_id, 'Số 123 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội', 
  21.03330000, 105.79500000, NULL, NOW(), NOW()
) ON DUPLICATE KEY UPDATE 
  `default_address` = VALUES(`default_address`),
  `updated_at` = NOW();
