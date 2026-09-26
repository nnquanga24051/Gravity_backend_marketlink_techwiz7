UPDATE reviews SET farmer_id = 90 WHERE review_id = 101;
SELECT review_id, order_id, customer_id, farmer_id, rating, comment, farmer_reply FROM reviews WHERE farmer_id = 90;
