INSERT INTO reviews (review_id, order_id, customer_id, farmer_id, product_id, rating, comment, farmer_reply, farmer_reply_at, is_hidden, created_at)
VALUES (106, 102, 109, 90, 101, 5, 'Rau muống rất giòn ngọt, dầm sấu tuyệt vời! Sạp bác Ba phục vụ chu đáo, đóng gói sạch sẽ.', NULL, NULL, 0, NOW());

SELECT * FROM reviews WHERE farmer_id = 90;
