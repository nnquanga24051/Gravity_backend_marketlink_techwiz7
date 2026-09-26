#!/bin/bash
set -e

mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS marketlink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'marketlink_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'MarketLink@2026Secure';
ALTER USER 'marketlink_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'MarketLink@2026Secure';
GRANT ALL PRIVILEGES ON marketlink_db.* TO 'marketlink_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "Importing schema.sql..."
mysql -u root marketlink_db < /var/www/marketlink/app/schema.sql

echo "Importing seed_all_tables_sample_data.sql..."
mysql -u root marketlink_db < /var/www/marketlink/app/seed_all_tables_sample_data.sql

echo "=== TABLES IN MARKETLINK_DB ==="
mysql -u root -e "SHOW TABLES FROM marketlink_db;"
