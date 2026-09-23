-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: marketlink_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `customer_profiles`
--

DROP TABLE IF EXISTS `customer_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_profiles` (
  `customer_id` bigint(20) NOT NULL,
  `default_address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `family_account_id` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`customer_id`),
  KEY `fk_cp_family` (`family_account_id`),
  CONSTRAINT `fk_cp_family` FOREIGN KEY (`family_account_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `family_account_invitations`
--

DROP TABLE IF EXISTS `family_account_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `family_account_invitations` (
  `invitation_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `inviter_id` bigint(20) NOT NULL,
  `invitee_email` varchar(255) NOT NULL,
  `invitee_id` bigint(20) DEFAULT NULL,
  `invitation_token` varchar(100) NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','EXPIRED') DEFAULT 'PENDING',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`invitation_id`),
  UNIQUE KEY `invitation_token` (`invitation_token`),
  KEY `fk_fai_inviter` (`inviter_id`),
  KEY `fk_fai_invitee` (`invitee_id`),
  CONSTRAINT `fk_fai_invitee` FOREIGN KEY (`invitee_id`) REFERENCES `customer_profiles` (`customer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fai_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `customer_profiles` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `farmer_cutoff_settings`
--

DROP TABLE IF EXISTS `farmer_cutoff_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `farmer_cutoff_settings` (
  `setting_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `market_id` bigint(20) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL,
  `cutoff_hours_before` int(11) NOT NULL DEFAULT 12 COMMENT 'Số giờ chốt đơn trước khi mở chợ',
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `uq_farmer_market_cutoff` (`farmer_id`,`market_id`,`day_of_week`),
  KEY `fk_fcs_market` (`market_id`),
  CONSTRAINT `fk_fcs_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fcs_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `farmer_kyc_documents`
--

DROP TABLE IF EXISTS `farmer_kyc_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `farmer_kyc_documents` (
  `document_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `document_type` enum('CITIZEN_ID_FRONT','CITIZEN_ID_BACK','BUSINESS_REGISTRATION','FOOD_SAFETY_CERT','ORGANIC_VIETGAP_CERT','FARM_PHOTO') NOT NULL,
  `document_url` varchar(500) NOT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`document_id`),
  KEY `idx_fkd_farmer_type` (`farmer_id`,`document_type`),
  CONSTRAINT `fk_fkd_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `farmer_market_assignments`
--

DROP TABLE IF EXISTS `farmer_market_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `farmer_market_assignments` (
  `assignment_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `market_id` bigint(20) NOT NULL,
  `stall_number` varchar(50) DEFAULT NULL,
  `status` enum('REGISTERED','ACTIVE','REVOKED') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uq_farmer_market` (`farmer_id`,`market_id`),
  KEY `fk_fma_market` (`market_id`),
  CONSTRAINT `fk_fma_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fma_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `farmer_profiles`
--

DROP TABLE IF EXISTS `farmer_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `farmer_profiles` (
  `farmer_id` bigint(20) NOT NULL,
  `stall_name` varchar(200) NOT NULL,
  `bio` text DEFAULT NULL,
  `farm_address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`farmer_id`),
  CONSTRAINT `fk_fp_user` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorites` (
  `favorite_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `customer_id` bigint(20) NOT NULL,
  `target_type` enum('FARMER','PRODUCT','MARKET') NOT NULL,
  `target_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uq_customer_target` (`customer_id`,`target_type`,`target_id`),
  CONSTRAINT `fk_fav_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_profiles` (`customer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `market_schedules`
--

DROP TABLE IF EXISTS `market_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `market_schedules` (
  `schedule_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `market_id` bigint(20) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '1: Thứ 2, ..., 7: Chủ nhật',
  `open_time` time NOT NULL,
  `close_time` time NOT NULL,
  PRIMARY KEY (`schedule_id`),
  KEY `fk_ms_market` (`market_id`),
  CONSTRAINT `fk_ms_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `markets`
--

DROP TABLE IF EXISTS `markets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `markets` (
  `market_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`market_id`),
  KEY `idx_markets_coords` (`latitude`,`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('ORDER_PLACED','ORDER_ACCEPTED','ORDER_READY','RESTOCK_ALERT','KYC_UPDATE','SYSTEM') NOT NULL,
  `reference_id` bigint(20) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_user_read` (`user_id`,`is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `order_item_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_oi_order` (`order_id`),
  KEY `fk_oi_product` (`product_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `order_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_code` varchar(30) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `farmer_id` bigint(20) NOT NULL,
  `market_id` bigint(20) NOT NULL,
  `slot_id` bigint(20) NOT NULL,
  `pickup_date` date NOT NULL,
  `cutoff_time` datetime NOT NULL COMMENT 'Hạn chót khách hàng được hủy/sửa đơn',
  `total_amount` decimal(12,2) NOT NULL,
  `order_status` enum('PLACED','ACCEPTED','DECLINED','READY_FOR_PICKUP','COMPLETED','CANCELLED') DEFAULT 'PLACED',
  `payment_method` varchar(30) DEFAULT 'PAY_AT_PICKUP',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_o_market` (`market_id`),
  KEY `fk_o_slot` (`slot_id`),
  KEY `idx_orders_customer` (`customer_id`,`order_status`),
  KEY `idx_orders_farmer_pickup` (`farmer_id`,`pickup_date`,`order_status`),
  CONSTRAINT `fk_o_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_profiles` (`customer_id`),
  CONSTRAINT `fk_o_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`),
  CONSTRAINT `fk_o_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`),
  CONSTRAINT `fk_o_slot` FOREIGN KEY (`slot_id`) REFERENCES `pickup_time_slots` (`slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pickup_time_slots`
--

DROP TABLE IF EXISTS `pickup_time_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pickup_time_slots` (
  `slot_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `market_id` bigint(20) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_orders_capacity` int(11) DEFAULT 10,
  PRIMARY KEY (`slot_id`),
  KEY `fk_pts_farmer` (`farmer_id`),
  KEY `fk_pts_market` (`market_id`),
  CONSTRAINT `fk_pts_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pts_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `product_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `unit` varchar(50) NOT NULL COMMENT 'kg, gram, bó, hộp, v.v.',
  `price` decimal(12,2) NOT NULL,
  `current_stock` decimal(10,2) DEFAULT 0.00,
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('AVAILABLE','SOLD_OUT','TEMPORARILY_UNAVAILABLE','BANNED') DEFAULT 'AVAILABLE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`product_id`),
  KEY `fk_p_cat` (`category_id`),
  KEY `idx_products_catalog` (`farmer_id`,`category_id`,`status`),
  CONSTRAINT `fk_p_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`),
  CONSTRAINT `fk_p_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `review_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `farmer_id` bigint(20) NOT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `farmer_reply` text DEFAULT NULL,
  `farmer_reply_at` datetime DEFAULT NULL,
  `is_hidden` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `fk_r_customer` (`customer_id`),
  KEY `fk_r_farmer` (`farmer_id`),
  KEY `fk_r_product` (`product_id`),
  CONSTRAINT `fk_r_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer_profiles` (`customer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_r_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_r_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_r_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_announcements`
--

DROP TABLE IF EXISTS `system_announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_announcements` (
  `announcement_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `admin_id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `published_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`announcement_id`),
  KEY `fk_sa_admin` (`admin_id`),
  CONSTRAINT `fk_sa_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `user_id` bigint(20) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_verifications`
--

DROP TABLE IF EXISTS `user_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_verifications` (
  `verification_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `verification_type` enum('EMAIL_CONFIRMATION','PHONE_OTP','PASSWORD_RESET') NOT NULL,
  `verification_code` varchar(10) NOT NULL,
  `target_destination` varchar(255) NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `attempts_count` int(11) DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`verification_id`),
  KEY `idx_uv_search` (`user_id`,`verification_type`,`is_used`),
  CONSTRAINT `fk_uv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `is_email_verified` tinyint(1) DEFAULT 0,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `is_phone_verified` tinyint(1) DEFAULT 0,
  `full_name` varchar(150) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','ACTIVE','SUSPENDED') DEFAULT 'PENDING',
  `kyc_status` enum('UNVERIFIED','PENDING','VERIFIED','REJECTED') DEFAULT 'UNVERIFIED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `verification_audit_logs`
--

DROP TABLE IF EXISTS `verification_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verification_audit_logs` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `target_user_id` bigint(20) NOT NULL,
  `admin_id` bigint(20) NOT NULL,
  `action` enum('APPROVE','REJECT','REQUEST_REVISION','SUSPEND') NOT NULL,
  `reason` text DEFAULT NULL,
  `reviewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `fk_val_target` (`target_user_id`),
  KEY `fk_val_admin` (`admin_id`),
  CONSTRAINT `fk_val_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_val_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weekly_stock_templates`
--

DROP TABLE IF EXISTS `weekly_stock_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `weekly_stock_templates` (
  `template_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `farmer_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `market_id` bigint(20) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '1: Thứ 2, ..., 7: Chủ nhật',
  `recurring_quantity` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`template_id`),
  KEY `fk_wst_farmer` (`farmer_id`),
  KEY `fk_wst_product` (`product_id`),
  KEY `fk_wst_market` (`market_id`),
  CONSTRAINT `fk_wst_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmer_profiles` (`farmer_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wst_market` FOREIGN KEY (`market_id`) REFERENCES `markets` (`market_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wst_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24  4:05:09
