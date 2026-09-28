package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.modules.user.dto.ActiveFarmerReportDto;
import com.gravity.marketlink.modules.user.dto.MarketRevenueReportDto;
import com.gravity.marketlink.modules.user.dto.PlatformMetricsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final DatabaseClient databaseClient;

    /**
     * Aggregates core platform metrics (Platform Metrics)
     */
    public Mono<PlatformMetricsResponse> getPlatformMetrics() {
        String sql = """
            SELECT 
                (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name IN ('FARMER', 'ROLE_FARMER')) AS total_farmers,
                (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name IN ('CUSTOMER', 'ROLE_CUSTOMER')) AS total_customers,
                (SELECT COUNT(*) FROM markets) AS total_markets,
                (SELECT COUNT(*) FROM orders) AS total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE order_status = 'COMPLETED') AS total_revenue,
                (SELECT COUNT(*) FROM users WHERE kyc_status = 'PENDING') AS pending_kyc_count
        """;

        return databaseClient.sql(sql)
                .map((row, metadata) -> PlatformMetricsResponse.builder()
                        .totalFarmers(row.get("total_farmers", Long.class))
                        .totalCustomers(row.get("total_customers", Long.class))
                        .totalMarkets(row.get("total_markets", Long.class))
                        .totalOrders(row.get("total_orders", Long.class))
                        .totalRevenue(row.get("total_revenue", BigDecimal.class))
                        .pendingKycCount(row.get("pending_kyc_count", Long.class))
                        .build())
                .one();
    }

    /**
     * Revenue and order summary report across market locations (Revenue Summary Across Markets)
     */
    public Flux<MarketRevenueReportDto> getMarketRevenueReports() {
        String sql = """
            SELECT m.market_id, 
                   m.name AS market_name, 
                   m.address, 
                   COUNT(o.order_id) AS total_orders, 
                   COALESCE(SUM(CASE WHEN o.order_status = 'COMPLETED' THEN o.total_amount ELSE 0 END), 0) AS total_revenue,
                   (SELECT COUNT(DISTINCT fma.farmer_id) FROM farmer_market_assignments fma WHERE fma.market_id = m.market_id AND fma.status = 'ACTIVE') AS active_farmers_count
            FROM markets m
            LEFT JOIN orders o ON m.market_id = o.market_id
            GROUP BY m.market_id, m.name, m.address
            ORDER BY total_revenue DESC
        """;

        return databaseClient.sql(sql)
                .map((row, metadata) -> MarketRevenueReportDto.builder()
                        .marketId(row.get("market_id", Long.class))
                        .marketName(row.get("market_name", String.class))
                        .address(row.get("address", String.class))
                        .totalOrders(row.get("total_orders", Long.class))
                        .totalRevenue(row.get("total_revenue", BigDecimal.class))
                        .activeFarmersCount(row.get("active_farmers_count", Long.class))
                        .build())
                .all();
    }

    /**
     * Ranking report of top active farmers (Most Active Farmers)
     */
    public Flux<ActiveFarmerReportDto> getMostActiveFarmers(int limit) {
        String sql = """
            SELECT fp.farmer_id, 
                   fp.stall_name, 
                   u.full_name, 
                   u.phone_number, 
                   COUNT(o.order_id) AS completed_orders, 
                   COALESCE(SUM(o.total_amount), 0) AS total_revenue
            FROM farmer_profiles fp
            JOIN users u ON fp.farmer_id = u.user_id
            LEFT JOIN orders o ON fp.farmer_id = o.farmer_id AND o.order_status = 'COMPLETED'
            GROUP BY fp.farmer_id, fp.stall_name, u.full_name, u.phone_number
            ORDER BY completed_orders DESC, total_revenue DESC
            LIMIT :limit
        """;

        int safeLimit = (limit > 0 && limit <= 50) ? limit : 10;

        return databaseClient.sql(sql)
                .bind("limit", safeLimit)
                .map((row, metadata) -> ActiveFarmerReportDto.builder()
                        .farmerId(row.get("farmer_id", Long.class))
                        .stallName(row.get("stall_name", String.class))
                        .fullName(row.get("full_name", String.class))
                        .phoneNumber(row.get("phone_number", String.class))
                        .completedOrders(row.get("completed_orders", Long.class))
                        .totalRevenue(row.get("total_revenue", BigDecimal.class))
                        .build())
                .all();
    }
}
