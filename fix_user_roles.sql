USE marketlink_db;

-- 1. Xóa bảng user_roles bị lỗi do sự cố sập nguồn/tắt đột ngột MariaDB
DROP TABLE IF EXISTS `user_roles`;

-- 2. Tạo lại bảng user_roles sạch sẽ
CREATE TABLE `user_roles` (
  `user_id` bigint(20) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Cấp phát lại Role cho các tài khoản hệ thống:
-- Admin (ROLE_ADMIN = 1)
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) 
SELECT user_id, 1, NOW() FROM users WHERE email = 'admin@marketlink.vn'
ON DUPLICATE KEY UPDATE `assigned_at` = NOW();

-- Nông dân (ROLE_FARMER = 2)
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) 
SELECT user_id, 2, NOW() FROM users WHERE email = 'farmer@marketlink.vn'
ON DUPLICATE KEY UPDATE `assigned_at` = NOW();

-- Khách hàng (ROLE_CUSTOMER = 3)
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) 
SELECT user_id, 3, NOW() FROM users WHERE email = 'customer@marketlink.vn'
ON DUPLICATE KEY UPDATE `assigned_at` = NOW();
