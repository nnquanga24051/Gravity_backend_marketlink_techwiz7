UPDATE orders SET customer_id = 91, order_status = 'COMPLETED' WHERE order_id = 101;
SELECT order_id, order_code, customer_id, farmer_id, order_status FROM orders WHERE order_id = 101;
