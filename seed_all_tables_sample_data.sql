-- ============================================================================
-- SCRIPT IMPORT DỮ LIỆU MẪU TOÀN BỘ CÁC BẢNG TRONG HỆ THỐNG MARKETLINK
-- Mỗi bảng có ít nhất 5 bản ghi mẫu chân thực, đúng nghiệp vụ Việt Nam
-- Chuẩn hóa quan hệ 3NF, bảo toàn khóa ngoại và liên kết dữ liệu chặt chẽ
-- ============================================================================

USE marketlink_db;

-- 1. BẢNG roles (5 vai trò trong hệ thống)
INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống có toàn quyền'),
(2, 'FARMER', 'Nông dân bán hàng tại các sạp chợ phiên'),
(3, 'CUSTOMER', 'Khách hàng đặt trước nông sản'),
(4, 'STAFF', 'Nhân viên điều phối và hỗ trợ vận hành phiên chợ'),
(5, 'MODERATOR', 'Kiểm duyệt viên chất lượng nội dung và đánh giá')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. BẢNG users (12 tài khoản mẫu đầy đủ thông tin, hash BCrypt chuẩn)
-- Mật khẩu mặc định cho các tài khoản mẫu: MarketLink@123 hoặc tương ứng theo vai trò
-- Hash BCrypt cho 'MarketLink@123': $2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.
INSERT INTO `users` (
  `user_id`, `email`, `is_email_verified`, `password_hash`, `phone_number`, 
  `is_phone_verified`, `full_name`, `avatar_url`, `status`, `kyc_status`, `created_at`, `updated_at`
) VALUES
-- Admins
(101, 'admin.nguyen@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0901000001', 1, 'Nguyễn Quản Trị', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(102, 'admin.tran@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0901000002', 1, 'Trần Minh Hoàng', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
-- Farmers (5 nông dân tiêu biểu)
(103, 'farmer.bavi@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0902000001', 1, 'Bác Ba Nông Dân Ba Vì', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(104, 'farmer.mocchau@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0902000002', 1, 'Cô Mộc Châu Xanh', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(105, 'farmer.dalat@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0902000003', 1, 'Anh Lâm Đồng Farm', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(106, 'farmer.haiduong@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0902000004', 1, 'Bác Thanh Hà Trái Cây', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(107, 'farmer.sapa@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0902000005', 1, 'Chị H’Mông Nấm Sa Pa', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
-- Customers (5 khách hàng tiêu biểu)
(108, 'customer.minhanh@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0903000001', 1, 'Lê Minh Anh', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(109, 'customer.quanghuy@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0903000002', 1, 'Phạm Quang Huy', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'ACTIVE', 'VERIFIED', NOW(), NOW()),
(110, 'customer.thutrang@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0903000003', 1, 'Hoàng Thu Trang', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'ACTIVE', 'UNVERIFIED', NOW(), NOW()),
(111, 'customer.ducthang@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0903000004', 1, 'Vũ Đức Thắng', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea', 'ACTIVE', 'UNVERIFIED', NOW(), NOW()),
(112, 'customer.hoangyen@marketlink.vn', 1, '$2a$10$Wd83YvVVeXMl0aPP7A5TR.r580nOvRriGV4rzTolvup.00QqUwrn.', '0903000005', 1, 'Đỗ Hoàng Yến', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 'ACTIVE', 'VERIFIED', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `full_name` = VALUES(`full_name`),
  `status` = VALUES(`status`),
  `kyc_status` = VALUES(`kyc_status`),
  `updated_at` = NOW();

-- 3. BẢNG user_roles (Gán quyền cho các tài khoản)
INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_at`) VALUES
(101, 1, NOW()),
(102, 1, NOW()),
(103, 2, NOW()),
(104, 2, NOW()),
(105, 2, NOW()),
(106, 2, NOW()),
(107, 2, NOW()),
(108, 3, NOW()),
(109, 3, NOW()),
(110, 3, NOW()),
(111, 3, NOW()),
(112, 3, NOW())
ON DUPLICATE KEY UPDATE `assigned_at` = VALUES(`assigned_at`);

-- 4. BẢNG user_verifications (Quản lý mã OTP và kích hoạt)
INSERT INTO `user_verifications` (
  `verification_id`, `user_id`, `verification_type`, `verification_code`, 
  `target_destination`, `is_used`, `attempts_count`, `expires_at`, `created_at`
) VALUES
(101, 108, 'EMAIL_CONFIRMATION', '849201', 'customer.minhanh@marketlink.vn', 1, 1, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW()),
(102, 109, 'PHONE_OTP', '193842', '0903000002', 1, 1, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW()),
(103, 104, 'PHONE_OTP', '552194', '0902000002', 1, 1, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW()),
(104, 110, 'PASSWORD_RESET', '773910', 'customer.thutrang@marketlink.vn', 0, 0, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NOW()),
(105, 105, 'EMAIL_CONFIRMATION', '441029', 'farmer.dalat@marketlink.vn', 1, 1, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
ON DUPLICATE KEY UPDATE `is_used` = VALUES(`is_used`);

-- 5. BẢNG farmer_profiles (Thông tin sạp và địa chỉ nông trại của 5 nông dân)
INSERT INTO `farmer_profiles` (
  `farmer_id`, `stall_name`, `bio`, `farm_address`, `latitude`, `longitude`, `is_approved`, `created_at`, `updated_at`
) VALUES
(103, 'Nông Trại Hữu Cơ Ba Vì', 'Chuyên cung cấp rau củ quả hữu cơ, nấm sạch và trái cây theo mùa đạt chuẩn VietGAP', 'Thôn 2, Xã Vân Hòa, Huyện Ba Vì, Hà Nội', 21.08210000, 105.35820000, 1, NOW(), NOW()),
(104, 'Vườn Rau Sinh Thái Mộc Châu', 'Rau xứ lạnh trồng tự nhiên trên cao nguyên Mộc Châu, tưới nước suối nguồn', 'Tiểu khu 32, TT Nông Trường Mộc Châu, Sơn La', 20.84250000, 104.65430000, 1, NOW(), NOW()),
(105, 'Nông Sản Sạch Đà Lạt Farm', 'Dâu tây giống Nhật, ớt chuông, cà chua cherry thủy canh chuẩn GlobalGAP', 'Phường 11, TP. Đà Lạt, Lâm Đồng', 11.94040000, 108.45830000, 1, NOW(), NOW()),
(106, 'Hợp Tác Xã Vải & Cây Ăn Trái Hải Dương', 'Đặc sản vải thiều Thanh Hà chính gốc, ổi bo giòn ngọt, cam đường canh', 'Xã Thanh Thủy, Huyện Thanh Hà, Hải Dương', 20.89720000, 106.41820000, 1, NOW(), NOW()),
(107, 'Hợp Tác Xã Dược Liệu & Nấm Sạch Sa Pa', 'Nấm hương rừng, nấm đông cô, mộc nhĩ đen và trà thảo mộc độ cao 1600m', 'Xã Tả Phìn, Thị xã Sa Pa, Lào Cai', 22.37810000, 103.86420000, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `stall_name` = VALUES(`stall_name`),
  `bio` = VALUES(`bio`),
  `is_approved` = VALUES(`is_approved`),
  `updated_at` = NOW();

-- 6. BẢNG farmer_kyc_documents (Hồ sơ pháp lý chứng thực nông dân)
INSERT INTO `farmer_kyc_documents` (
  `document_id`, `farmer_id`, `document_type`, `document_url`, `document_number`, `issued_date`, `expiry_date`, `created_at`
) VALUES
(101, 103, 'ORGANIC_VIETGAP_CERT', 'https://storage.marketlink.vn/kyc/cert_vietgap_bavi.pdf', 'VG-2026-HN089', '2024-01-15', '2027-01-15', NOW()),
(102, 103, 'FOOD_SAFETY_CERT', 'https://storage.marketlink.vn/kyc/attp_bavi.pdf', 'ATTP-BV-8821', '2024-02-01', '2027-02-01', NOW()),
(103, 104, 'BUSINESS_REGISTRATION', 'https://storage.marketlink.vn/kyc/gpkd_htx_mocchau.pdf', '0108928374', '2023-05-10', '2033-05-10', NOW()),
(104, 105, 'ORGANIC_VIETGAP_CERT', 'https://storage.marketlink.vn/kyc/organic_dalat.pdf', 'ORG-DL-9921', '2024-03-20', '2027-03-20', NOW()),
(105, 106, 'CITIZEN_ID_FRONT', 'https://storage.marketlink.vn/kyc/cccd_front_haiduong.jpg', '030094002819', '2022-08-12', '2035-08-12', NOW()),
(106, 107, 'FOOD_SAFETY_CERT', 'https://storage.marketlink.vn/kyc/attp_sapa.pdf', 'ATTP-LC-4421', '2024-04-10', '2027-04-10', NOW())
ON DUPLICATE KEY UPDATE `document_number` = VALUES(`document_number`);

-- 7. BẢNG customer_profiles (Địa chỉ nhận hàng và tọa độ của khách hàng)
INSERT INTO `customer_profiles` (
  `customer_id`, `default_address`, `latitude`, `longitude`, `family_account_id`, `created_at`, `updated_at`
) VALUES
(108, 'Số 123 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội', 21.03330000, 105.79500000, NULL, NOW(), NOW()),
(109, 'Số 45 Đường Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội', 20.99840000, 105.81520000, 108, NOW(), NOW()),
(110, 'Số 88 Phố Hoàng Hoa Thám, Phường Thụy Khuê, Quận Tây Hồ, Hà Nội', 21.04210000, 105.82190000, NULL, NOW(), NOW()),
(111, 'Số 12 Phố Láng Hạ, Phường Thành Công, Quận Ba Đình, Hà Nội', 21.01890000, 105.81370000, NULL, NOW(), NOW()),
(112, 'Số 68 Phố Hai Bà Trưng, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội', 21.02670000, 105.84920000, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `default_address` = VALUES(`default_address`),
  `family_account_id` = VALUES(`family_account_id`),
  `updated_at` = NOW();

-- 8. BẢNG family_account_invitations (Lời mời liên kết tài khoản gia đình)
INSERT INTO `family_account_invitations` (
  `invitation_id`, `inviter_id`, `invitee_email`, `invitee_id`, `invitation_token`, `status`, `expires_at`, `created_at`
) VALUES
(101, 108, 'customer.quanghuy@marketlink.vn', 109, 'INV-FAM-TOKEN-001', 'ACCEPTED', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW()),
(102, 108, 'family.grandma@gmail.com', NULL, 'INV-FAM-TOKEN-002', 'PENDING', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW()),
(103, 110, 'customer.ducthang@marketlink.vn', 111, 'INV-FAM-TOKEN-003', 'ACCEPTED', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW()),
(104, 110, 'cousin.anh@yahoo.com', NULL, 'INV-FAM-TOKEN-004', 'EXPIRED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(105, 112, 'family.nephew@gmail.com', NULL, 'INV-FAM-TOKEN-005', 'REJECTED', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- 9. BẢNG verification_audit_logs (Lịch sử kiểm toán duyệt KYC của Admin)
INSERT INTO `verification_audit_logs` (
  `log_id`, `target_user_id`, `admin_id`, `action`, `reason`, `reviewed_at`
) VALUES
(101, 103, 101, 'APPROVE', 'Hồ sơ chứng nhận VietGAP và ATTP nông trại Ba Vì đạt chuẩn chất lượng kiểm định.', NOW()),
(102, 104, 101, 'APPROVE', 'Hồ sơ pháp lý hợp tác xã Mộc Châu đầy đủ, xuất xứ rau quả minh bạch.', NOW()),
(103, 105, 101, 'APPROVE', 'Chứng nhận GlobalGAP Đà Lạt hợp lệ, diện tích canh tác rõ ràng trên bản đồ.', NOW()),
(104, 106, 102, 'REQUEST_REVISION', 'Yêu cầu tải lên lại ảnh chụp CCCD mặt sau rõ nét hơn.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(105, 107, 102, 'APPROVE', 'Hồ sơ kiểm nghiệm vi sinh và xuất xứ nấm tự nhiên Sa Pa đạt tiêu chuẩn an toàn.', NOW())
ON DUPLICATE KEY UPDATE `reason` = VALUES(`reason`);

-- 10. BẢNG markets (5 điểm chợ nông sản địa phương tiêu biểu)
INSERT INTO `markets` (
  `market_id`, `name`, `address`, `latitude`, `longitude`, `description`, `image_url`, `status`, `created_at`, `updated_at`
) VALUES
(101, 'Phiên Chợ Xanh Nông Sản Ba Đình', '12 Núi Trúc, Phường Giảng Võ, Quận Ba Đình, Hà Nội', 21.02850000, 105.82340000, 'Chợ phiên cuối tuần quy tụ hơn 30 nhà vườn đạt chuẩn VietGAP và hữu cơ vùng Bắc Bộ.', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9', 'ACTIVE', NOW(), NOW()),
(102, 'Chợ Nông Sản Sạch Cuối Tuần Cầu Giấy', 'Cổng số 2, Công viên Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 21.02610000, 105.78920000, 'Không gian mua sắm nông sản gia đình thân thiện, có bãi đỗ xe và khu vực nhận hàng nhanh.', 'https://images.unsplash.com/photo-1542838132-92c53300491e', 'ACTIVE', NOW(), NOW()),
(103, 'Phiên Chợ Hữu Cơ Thảo Điền EcoMarket', '28 Thảo Điền, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh', 10.80320000, 106.73280000, 'Phiên chợ thực phẩm xanh, bánh men thủ công và trái cây hữu cơ miền Tây Nam Bộ.', 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d', 'ACTIVE', NOW(), NOW()),
(104, 'Hội Chợ Nông Sản Vùng Miền Tây Hồ', '614 Lạc Long Quân, Phường Nhật Tân, Quận Tây Hồ, Hà Nội', 21.07220000, 105.81750000, 'Giao lưu nông sản đặc sản vùng cao Tây Bắc, mật ong rừng, gạo nương và hoa quả tươi.', 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf', 'ACTIVE', NOW(), NOW()),
(105, 'Chợ Phiên Nông Nghiệp Xanh Ecopark', 'Khuôn viên Công viên Mùa Hạ, Khu đô thị Ecopark, Văn Giang, Hưng Yên', 20.96340000, 105.93210000, 'Chợ phiên sinh thái phục vụ cư dân đô thị với nguồn rau quả hái tươi trong ngày.', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `address` = VALUES(`address`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();

-- 11. BẢNG market_schedules (Lịch họp chợ định kỳ trong tuần)
INSERT INTO `market_schedules` (`schedule_id`, `market_id`, `day_of_week`, `open_time`, `close_time`) VALUES
(101, 101, 6, '06:30:00', '11:30:00'), -- Thứ 7: Ba Đình
(102, 101, 7, '06:30:00', '12:00:00'), -- Chủ nhật: Ba Đình
(103, 102, 6, '07:00:00', '12:00:00'), -- Thứ 7: Cầu Giấy
(104, 102, 7, '07:00:00', '12:00:00'), -- Chủ nhật: Cầu Giấy
(105, 103, 7, '08:00:00', '16:00:00'), -- Chủ nhật: Thảo Điền
(106, 104, 7, '06:30:00', '11:30:00'), -- Chủ nhật: Tây Hồ
(107, 105, 6, '07:30:00', '13:00:00')  -- Thứ 7: Ecopark
ON DUPLICATE KEY UPDATE `open_time` = VALUES(`open_time`), `close_time` = VALUES(`close_time`);

-- 12. BẢNG farmer_market_assignments (Nông dân đăng ký số hiệu sạp tại chợ)
INSERT INTO `farmer_market_assignments` (
  `assignment_id`, `farmer_id`, `market_id`, `stall_number`, `status`, `created_at`
) VALUES
(101, 103, 101, 'SẠP-A01', 'ACTIVE', NOW()), -- Ba Vì tại Chợ Ba Đình
(102, 104, 101, 'SẠP-A02', 'ACTIVE', NOW()), -- Mộc Châu tại Chợ Ba Đình
(103, 105, 102, 'SẠP-B05', 'ACTIVE', NOW()), -- Đà Lạt tại Chợ Cầu Giấy
(104, 106, 102, 'SẠP-B06', 'ACTIVE', NOW()), -- Hải Dương tại Chợ Cầu Giấy
(105, 107, 104, 'SẠP-C10', 'ACTIVE', NOW()), -- Sa Pa tại Chợ Tây Hồ
(106, 103, 102, 'SẠP-B01', 'ACTIVE', NOW())  -- Ba Vì tại Chợ Cầu Giấy
ON DUPLICATE KEY UPDATE `stall_number` = VALUES(`stall_number`), `status` = VALUES(`status`);

-- 13. BẢNG categories (5 danh mục hàng hóa chuẩn)
INSERT INTO `categories` (`category_id`, `name`, `slug`, `description`) VALUES
(1, 'Rau Lá Hữu Cơ', 'rau-la-huu-co', 'Các loại rau xanh ăn lá tươi sạch thu hoạch trong ngày'),
(2, 'Củ & Quả Tươi Sạch', 'cu-qua-tuoi-sach', 'Củ quả canh tác an toàn, không tồn dư hóa chất bảo vệ thực vật'),
(3, 'Trái Cây Bản Địa', 'trai-cay-ban-dia', 'Hoa quả đặc sản các vùng miền Việt Nam thu hoạch đúng độ chín tự nhiên'),
(4, 'Nấm & Thảo Dược', 'nam-thao-duoc', 'Nấm tươi, nấm quý, mộc nhĩ rừng và thảo dược bồi bổ sức khỏe'),
(5, 'Sữa & Chế Phẩm Thủ Công', 'sua-che-pham-thu-cong', 'Sữa dê, sữa bò thanh trùng, phô mai và sản phẩm lên men truyền thống')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);

-- 14. BẢNG products (6 mặt hàng nông sản tiêu biểu kèm số lượng tồn kho)
INSERT INTO `products` (
  `product_id`, `farmer_id`, `category_id`, `name`, `description`, `unit`, `price`, `current_stock`, `image_url`, `status`, `created_at`, `updated_at`
) VALUES
(101, 103, 1, 'Cải Bó Xôi Hữu Cơ Ba Vì', 'Rau bina trồng hữu cơ vi sinh, lá dày xanh thẫm, giàu sắt và vitamin', 'kg', 45000.00, 35.00, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb', 'AVAILABLE', NOW(), NOW()),
(102, 103, 1, 'Rau Muống Tiến Vua Sạch', 'Thu hoạch sớm từ ngọn non, thân giòn xào tỏi hoặc nấu canh thanh mát', 'bó', 15000.00, 60.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999', 'AVAILABLE', NOW(), NOW()),
(103, 104, 2, 'Cà Chua Cherry Mộc Châu Ngọt Giòn', 'Cà chua bi giống Socola Mộc Châu vỏ mỏng mọng nước, vị ngọt đậm đà', 'hộp 500g', 35000.00, 45.00, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea', 'AVAILABLE', NOW(), NOW()),
(104, 105, 3, 'Dâu Tây Hana Đà Lạt Tuyển Chọn', 'Dâu tây giống Hana hái tại vườn Đà Lạt lúc sáng sớm, thơm lừng vị ngọt', 'hộp 500g', 125000.00, 30.00, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6', 'AVAILABLE', NOW(), NOW()),
(105, 106, 3, 'Vải Thiều Thanh Hà Chính Gốc', 'Cùi dày hạt tiêu mọng nước, ngọt sắc hương thơm đặc trưng vùng Thanh Hà', 'kg', 65000.00, 80.00, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba', 'AVAILABLE', NOW(), NOW()),
(106, 107, 4, 'Nấm Hương Rừng Sa Pa Tươi', 'Nấm hương sinh trưởng tự nhiên trên gỗ mục vùng núi Tả Phìn, thơm nồng', 'kg', 98000.00, 20.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', 'AVAILABLE', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `name` = VALUES(`name`),
  `price` = VALUES(`price`),
  `current_stock` = VALUES(`current_stock`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();

-- 15. BẢNG weekly_stock_templates (Mẫu tồn kho chuẩn bị cho từng buổi chợ)
INSERT INTO `weekly_stock_templates` (
  `template_id`, `farmer_id`, `product_id`, `market_id`, `day_of_week`, `recurring_quantity`, `is_active`
) VALUES
(101, 103, 101, 101, 6, 30.00, 1), -- Thứ 7: Ba Vì bán 30kg cải bó xôi tại Ba Đình
(102, 103, 102, 101, 6, 50.00, 1), -- Thứ 7: Ba Vì bán 50 bó rau muống tại Ba Đình
(103, 104, 103, 101, 7, 40.00, 1), -- Chủ nhật: Mộc Châu bán 40 hộp cà chua tại Ba Đình
(104, 105, 104, 102, 6, 25.00, 1), -- Thứ 7: Đà Lạt bán 25 hộp dâu tây tại Cầu Giấy
(105, 106, 105, 102, 7, 60.00, 1)  -- Chủ nhật: Hải Dương bán 60kg vải thiều tại Cầu Giấy
ON DUPLICATE KEY UPDATE `recurring_quantity` = VALUES(`recurring_quantity`);

-- 16. BẢNG farmer_cutoff_settings (Thời điểm chốt đơn của nông dân trước giờ mở chợ)
INSERT INTO `farmer_cutoff_settings` (
  `setting_id`, `farmer_id`, `market_id`, `day_of_week`, `cutoff_hours_before`
) VALUES
(101, 103, 101, 6, 12), -- Chốt trước 12 tiếng để thu hoạch sớm
(102, 103, 101, 7, 10),
(103, 104, 101, 7, 14), -- Mộc Châu vận chuyển xa chốt trước 14 tiếng
(104, 105, 102, 6, 16), -- Đà Lạt bay ra chốt trước 16 tiếng
(105, 106, 102, 7, 12)
ON DUPLICATE KEY UPDATE `cutoff_hours_before` = VALUES(`cutoff_hours_before`);

-- 17. BẢNG pickup_time_slots (Khung giờ đón khách nhận hàng tại sạp chợ)
INSERT INTO `pickup_time_slots` (
  `slot_id`, `farmer_id`, `market_id`, `start_time`, `end_time`, `max_orders_capacity`
) VALUES
(101, 103, 101, '07:00:00', '08:00:00', 15),
(102, 103, 101, '08:00:00', '09:00:00', 20),
(103, 103, 101, '09:00:00', '10:00:00', 20),
(104, 104, 101, '07:30:00', '08:30:00', 15),
(105, 105, 102, '08:00:00', '09:00:00', 15),
(106, 106, 102, '08:30:00', '09:30:00', 12)
ON DUPLICATE KEY UPDATE `max_orders_capacity` = VALUES(`max_orders_capacity`);

-- 18. BẢNG orders (8 đơn đặt trước tiêu biểu qua các trạng thái)
INSERT INTO `orders` (
  `order_id`, `order_code`, `customer_id`, `farmer_id`, `market_id`, `slot_id`, 
  `pickup_date`, `cutoff_time`, `total_amount`, `order_status`, `payment_method`, `note`, `created_at`, `updated_at`
) VALUES
(101, 'ORD-2026-001', 108, 103, 101, 101, '2026-09-27', '2026-09-26 18:30:00', 90000.00, 'COMPLETED', 'PAY_AT_PICKUP', 'Lấy rau bó tươi sáng sớm giúp em nhé bác Ba', NOW(), NOW()),
(102, 'ORD-2026-002', 109, 103, 101, 102, '2026-09-27', '2026-09-26 18:30:00', 60000.00, 'READY_FOR_PICKUP', 'PAY_AT_PICKUP', 'Gói kèm một nắm ớt cay giúp mình', NOW(), NOW()),
(103, 'ORD-2026-003', 110, 104, 101, 104, '2026-09-27', '2026-09-26 17:00:00', 70000.00, 'ACCEPTED', 'PAY_AT_PICKUP', 'Mình sẽ ghé sạp tầm 8h sáng', NOW(), NOW()),
(104, 'ORD-2026-004', 111, 105, 102, 105, '2026-09-27', '2026-09-26 15:00:00', 250000.00, 'PLACED', 'PAY_AT_PICKUP', 'Chọn dâu tây quả to đều để làm quà biếu', NOW(), NOW()),
(105, 'ORD-2026-005', 112, 106, 102, 106, '2026-09-28', '2026-09-27 16:30:00', 130000.00, 'COMPLETED', 'PAY_AT_PICKUP', 'Vải thiều tươi cành lá xanh nhé', NOW(), NOW()),
(106, 'ORD-2026-006', 108, 107, 104, 105, '2026-09-28', '2026-09-27 16:30:00', 98000.00, 'COMPLETED', 'PAY_AT_PICKUP', 'Nấm hương khô ráo không bị dập', NOW(), NOW()),
(107, 'ORD-2026-007', 109, 105, 102, 105, '2026-09-27', '2026-09-26 15:00:00', 125000.00, 'COMPLETED', 'PAY_AT_PICKUP', 'Lấy hộp dâu chín tới', NOW(), NOW()),
(108, 'ORD-2026-008', 110, 104, 101, 104, '2026-09-27', '2026-09-26 17:00:00', 35000.00, 'COMPLETED', 'PAY_AT_PICKUP', 'Cà chua ngọt giòn', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  `order_status` = VALUES(`order_status`),
  `total_amount` = VALUES(`total_amount`),
  `updated_at` = NOW();

-- 19. BẢNG order_items (Chi tiết từng món trong các đơn đặt trước)
INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(101, 101, 101, 2.00, 45000.00, 90000.00),  -- 2kg cải bó xôi
(102, 102, 102, 4.00, 15000.00, 60000.00),  -- 4 bó rau muống
(103, 103, 103, 2.00, 35000.00, 70000.00),  -- 2 hộp cà chua cherry
(104, 104, 104, 2.00, 125000.00, 250000.00), -- 2 hộp dâu tây Hana
(105, 105, 105, 2.00, 65000.00, 130000.00), -- 2kg vải thiều Thanh Hà
(106, 106, 106, 1.00, 98000.00, 98000.00),  -- 1kg nấm hương Sa Pa
(107, 107, 104, 1.00, 125000.00, 125000.00), -- 1 hộp dâu tây
(108, 108, 103, 1.00, 35000.00, 35000.00)   -- 1 hộp cà chua
ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`), `subtotal` = VALUES(`subtotal`);

-- 20. BẢNG reviews (5 đánh giá sao chân thực của khách hàng kèm phản hồi của nông dân)
INSERT INTO `reviews` (
  `review_id`, `order_id`, `customer_id`, `farmer_id`, `product_id`, 
  `rating`, `comment`, `farmer_reply`, `farmer_reply_at`, `is_hidden`, `created_at`
) VALUES
(101, 101, 108, 103, 101, 5, 'Rau cải bó xôi rất tươi, luộc ngọt nước. Bác nông dân Ba Vì nhiệt tình, dặn dò cách bảo quản kỹ lưỡng.', 'Cảm ơn cháu nhiều nhé, tuần sau ghé sạp bác lại tặng thêm ít rau thơm!', NOW(), 0, NOW()),
(102, 105, 112, 106, 105, 5, 'Vải thiều Thanh Hà đúng chuẩn đặc sản, cùi dày hạt nhỏ mọng nước, cả nhà mình ai cũng khen tấm tắc.', 'Dạ nhà vườn cảm ơn quý khách đã tin tưởng và thưởng thức vải quê Thanh Hà ạ!', NOW(), 0, NOW()),
(103, 106, 108, 107, 106, 5, 'Nấm hương Sa Pa thơm nức mùi gỗ rừng tự nhiên, nấu canh gà ngon tuyệt vời.', 'Hợp tác xã Sa Pa cảm ơn chị, chúc chị và gia đình luôn ngon miệng!', NOW(), 0, NOW()),
(104, 107, 109, 105, 104, 4, 'Dâu tây thơm ngọt thanh, quả nguyên vẹn không bị dập nát khi nhận tại sạp.', 'Cảm ơn anh Huy đã ủng hộ dâu sạch vườn Đà Lạt!', NOW(), 0, NOW()),
(105, 108, 110, 104, 103, 5, 'Cà chua cherry giòn ngọt, bé nhà mình thích ăn sống chấm muối hồng lắm!', 'Nông trại Mộc Châu rất vui vì các bé thích ăn rau quả tươi sạch ạ!', NOW(), 0, NOW())
ON DUPLICATE KEY UPDATE `comment` = VALUES(`comment`), `rating` = VALUES(`rating`);

-- 21. BẢNG favorites (Danh mục mục quan tâm của khách hàng: FARMER, PRODUCT, MARKET)
INSERT INTO `favorites` (`favorite_id`, `customer_id`, `target_type`, `target_id`, `created_at`) VALUES
(101, 108, 'FARMER', 103, NOW()),  -- Lê Minh Anh yêu thích Bác Ba Ba Vì
(102, 108, 'PRODUCT', 104, NOW()), -- Lê Minh Anh yêu thích Dâu tây Hana
(103, 108, 'MARKET', 101, NOW()),  -- Lê Minh Anh lưu Chợ Ba Đình
(104, 109, 'FARMER', 104, NOW()),  -- Quang Huy yêu thích Vườn Mộc Châu
(105, 110, 'MARKET', 102, NOW()),  -- Thu Trang lưu Chợ Cầu Giấy
(106, 112, 'PRODUCT', 105, NOW())  -- Hoàng Yến yêu thích Vải thiều Thanh Hà
ON DUPLICATE KEY UPDATE `created_at` = VALUES(`created_at`);

-- 22. BẢNG notifications (Hệ thống thông báo thông minh in-app)
INSERT INTO `notifications` (
  `notification_id`, `user_id`, `title`, `message`, `type`, `reference_id`, `is_read`, `created_at`
) VALUES
(101, 108, 'Đơn hàng đã hoàn tất nhận', 'Đơn hàng ORD-2026-001 của bạn tại sạp Nông Trại Ba Vì đã hoàn thành. Hãy để lại đánh giá nhé!', 'ORDER_READY', 101, 1, NOW()),
(102, 109, 'Nông sản đã sẵn sàng lấy tại sạp', 'Đơn hàng ORD-2026-002 đã được đóng gói xong, bạn có thể tới sạp SẠP-A01 để nhận hàng.', 'ORDER_READY', 102, 0, NOW()),
(103, 103, 'Có đơn đặt trước nông sản mới', 'Khách hàng Lê Minh Anh vừa đặt trước 2kg Cải bó xôi cho phiên chợ Thứ 7 tới.', 'ORDER_PLACED', 101, 1, NOW()),
(104, 104, 'Hồ sơ KYC nông dân đã được phê duyệt', 'Chúc mừng bạn! Hồ sơ mở sạp nông sản Mộc Châu đã được Quản trị viên duyệt thành công.', 'KYC_UPDATE', 104, 1, NOW()),
(105, 111, 'Thông báo hàng restock tươi mới', 'Nông sản bạn quan tâm [Dâu Tây Hana Đà Lạt] vừa cập nhật số lượng đặt trước mới.', 'RESTOCK_ALERT', 104, 0, NOW()),
(106, 112, 'Chào mừng đến với MarketLink', 'Tài khoản của bạn đã kích hoạt thành công. Bắt đầu khám phá các phiên chợ nông sản quanh bạn ngay!', 'SYSTEM', 112, 1, NOW())
ON DUPLICATE KEY UPDATE `is_read` = VALUES(`is_read`);

-- 23. BẢNG system_announcements (Bản tin thông báo toàn sàn do Quản trị viên đăng)
INSERT INTO `system_announcements` (
  `announcement_id`, `admin_id`, `title`, `content`, `is_active`, `published_at`
) VALUES
(101, 101, 'Lịch hoạt động phiên chợ nông sản sạch cuối tuần này', 'Kính gửi bà con và quý khách hàng, toàn bộ các điểm chợ phiên Ba Đình, Cầu Giấy và Tây Hồ sẽ mở cửa đón khách từ 06:30 đến 12:00 Thứ Bảy và Chủ Nhật. Kính mời quý khách tới trải nghiệm nông sản sạch!', 1, NOW()),
(102, 101, 'Quy chuẩn an toàn thực phẩm VietGAP & Organic mới 2026', 'Ban quản lý MarketLink tiến hành tái kiểm định định kỳ 100% chứng chỉ VietGAP của các nhà vườn liên kết nhằm bảo đảm an toàn thực phẩm tuyệt đối cho người tiêu dùng.', 1, NOW()),
(103, 101, 'Hướng dẫn nhận hàng Pay-at-pickup đúng giờ và tiện lợi', 'Để tránh ùn tắc tại sạp chợ vào giờ cao điểm, quý khách vui lòng đến đúng khung giờ đã chọn trong đơn đặt trước và kiểm tra nông sản kỹ càng trước khi thanh toán trực tiếp.', 1, NOW()),
(104, 102, 'Bảo trì nâng cấp hạ tầng máy chủ định kỳ', 'Hệ thống MarketLink sẽ tiến hành tối ưu hóa đường truyền từ 01:00 đến 02:00 sáng Thứ Hai. Các tính năng đặt trước vẫn hoạt động bình thường sau thời gian này.', 1, NOW()),
(105, 102, 'Chương trình “Đi chợ xanh - Giảm rác thải nhựa”', 'MarketLink khuyến khích khách hàng tự mang làn cói hoặc túi vải tái sử dụng khi nhận hàng tại sạp để cùng chung tay bảo vệ môi trường nông nghiệp bền vững.', 1, NOW())
ON DUPLICATE KEY UPDATE 
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `is_active` = VALUES(`is_active`);

-- ============================================================================
-- HOÀN TẤT IMPORT DỮ LIỆU MẪU TOÀN BỘ 23 BẢNG HỆ THỐNG MARKETLINK
-- ============================================================================
