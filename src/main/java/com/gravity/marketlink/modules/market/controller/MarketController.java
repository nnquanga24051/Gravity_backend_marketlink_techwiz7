package com.gravity.marketlink.modules.market.controller;

import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.market.dto.AdminAssignStallRequest;
import com.gravity.marketlink.modules.market.dto.FarmerAtMarketResponse;
import com.gravity.marketlink.modules.market.dto.FarmerRegisterMarketRequest;
import com.gravity.marketlink.modules.market.dto.MarketDetailResponse;
import com.gravity.marketlink.modules.market.dto.MarketRequest;
import com.gravity.marketlink.modules.market.entity.FarmerMarketAssignment;
import com.gravity.marketlink.modules.market.entity.Market;
import com.gravity.marketlink.modules.market.service.MarketService;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@Tag(name = "5. Farmers Markets & Map Routing", description = "APIs for discovering farmers markets, map pins, operating schedules, and active stalls")
@RestController
@RequiredArgsConstructor
public class MarketController {

    private final MarketService marketService;

    // ===================================================================
    // PUBLIC APIS (Customer & Map Applications)
    // ===================================================================

    @Operation(summary = "Get farmers market list (Map Pins)", description = "Returns all active market locations with GPS coordinates, keyword search by name, address, and session days.")
    @GetMapping("/api/markets")
    public Flux<Market> getAllMarkets(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "dayOfWeek", required = false) Integer dayOfWeek) {
        return marketService.getAllActiveMarkets(search, city, dayOfWeek);
    }

    @Operation(summary = "Browse & Search farmer stalls across platform or by market", description = "Quick search for farmer stalls by keyword (stall name, owner name, farm address) or market ID.")
    @GetMapping("/api/markets/stalls")
    public Flux<FarmerAtMarketResponse> getStalls(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "marketId", required = false) Long marketId) {
        return marketService.getAllStalls(search, marketId);
    }

    @Operation(summary = "Get market details and session schedules", description = "Returns details of a specific market with recurring weekly schedules and stall counts.")
    @GetMapping("/api/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<MarketDetailResponse>> getMarketDetail(@PathVariable("id") Long id) {
        return marketService.getMarketDetail(id)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "View farmer stalls active at market", description = "Returns active farmers and assigned stall numbers at market.")
    @GetMapping("/api/markets/{id:[0-9]+}/farmers")
    public Flux<FarmerAtMarketResponse> getFarmersAtMarket(@PathVariable("id") Long id) {
        return marketService.getFarmersAtMarket(id);
    }

    @Operation(summary = "Filter markets by day of week", description = "Filter markets operating on specific day: 1 = Monday, ..., 6 = Saturday, 7 = Sunday.")
    @GetMapping("/api/markets/filter-by-day")
    public Flux<Market> getMarketsByDayOfWeek(@RequestParam("dayOfWeek") Integer dayOfWeek) {
        return marketService.getMarketsByDayOfWeek(dayOfWeek);
    }

    // ===================================================================
    // FARMER APIS (Farmer Stall Management)
    // ===================================================================

    @Operation(summary = "Farmer registers for market stall", description = "Requires ROLE_FARMER to register a stall at market.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/api/farmer/markets/register")
    public Mono<ResponseEntity<FarmerMarketAssignment>> registerMarket(
            Authentication authentication,
            @Valid @RequestBody FarmerRegisterMarketRequest request) {
        return marketService.farmerRegisterMarket(authentication.getName(), request)
                .map(assignment -> ResponseEntity.status(HttpStatus.CREATED).body(assignment));
    }

    @Operation(summary = "View markets farmer has registered for", description = "Returns all markets where current farmer operates a stall.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/api/farmer/markets/my-assignments")
    public Flux<FarmerMarketAssignment> getMyMarketAssignments(Authentication authentication) {
        return marketService.getMyMarketAssignments(authentication.getName());
    }

    // ===================================================================
    // ADMIN APIS (System Administration - Full CRUD Markets & Stalls)
    // ===================================================================

    @Operation(summary = "Admin gets list of all farmers markets", description = "Retrieves all farmers markets with status filter (ALL, ACTIVE, INACTIVE) and search by name or address.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets")
    public Mono<ResponseEntity<ApiResponse<List<MarketDetailResponse>>>> getAllMarketsForAdmin(
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(value = "search", required = false) String search) {
        return marketService.getAllMarketsForAdmin(status, search)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved market list successfully.", list)));
    }

    @Operation(summary = "Admin views market details", description = "Retrieves complete market details, schedules, and active stalls (including INACTIVE markets).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> getMarketDetailForAdmin(@PathVariable("id") Long id) {
        return marketService.getMarketDetail(id)
                .map(detail -> ResponseEntity.ok(ApiResponse.success("Retrieved market details successfully.", detail)));
    }

    @Operation(summary = "Admin creates new farmers market", description = "Creates new market location with weekly session schedules.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/markets")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> createMarket(@Valid @RequestBody MarketRequest request) {
        return marketService.createMarket(request)
                .map(market -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Created new farmers market successfully.", market)));
    }

    @Operation(summary = "Admin updates market and schedules", description = "Updates name, address, GPS coordinates, description, thumbnail, and weekly schedules.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> updateMarket(
            @PathVariable("id") Long id,
            @Valid @RequestBody MarketRequest request) {
        return marketService.updateMarket(id, request)
                .map(market -> ResponseEntity.ok(ApiResponse.success("Updated market information successfully.", market)));
    }

    @Operation(summary = "Admin changes market operating status", description = "Quickly activates (ACTIVE) or pauses (INACTIVE) market.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/markets/{id:[0-9]+}/status")
    public Mono<ResponseEntity<ApiResponse<MarketDetailResponse>>> updateMarketStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") String status) {
        return marketService.updateMarketStatus(id, status)
                .map(market -> ResponseEntity.ok(ApiResponse.success("Updated market status successfully (" + status + ").", market)));
    }

    @Operation(summary = "Admin pauses market operation (Soft delete)", description = "Sets market status to INACTIVE to hide from buyers while preserving data integrity.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/{id:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteMarket(@PathVariable("id") Long id) {
        return marketService.deleteMarket(id)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Paused market successfully.", result)));
    }

    @Operation(summary = "Admin permanently deletes market", description = "Permanently deletes market and schedules if no linked pre-orders exist.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/{id:[0-9]+}/permanent")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteMarketPermanently(@PathVariable("id") Long id) {
        return marketService.deleteMarketPermanently(id)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Permanently deleted market successfully.", result)));
    }

    @Operation(summary = "Admin assigns stall to farmer", description = "Directly assigns farmer to specific stall code at market.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/markets/assignments")
    public Mono<ResponseEntity<ApiResponse<FarmerMarketAssignment>>> adminAssignStall(
            @Valid @RequestBody AdminAssignStallRequest request) {
        return marketService.adminAssignStall(request)
                .map(assignment -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Assigned stall to farmer successfully.", assignment)));
    }

    @Operation(summary = "Admin views all stalls at market", description = "View all farmers and stalls registered/allocated at market across all statuses.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/markets/{id:[0-9]+}/assignments")
    public Mono<ResponseEntity<ApiResponse<List<FarmerAtMarketResponse>>>> getMarketAssignmentsForAdmin(
            @PathVariable("id") Long id) {
        return marketService.getMarketAssignmentsForAdmin(id)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved market stall list successfully.", list)));
    }

    @Operation(summary = "Admin approves or revokes stall", description = "Updates farmer stall status (ACTIVE, REVOKED, REGISTERED).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/api/admin/markets/assignments/{assignmentId:[0-9]+}/status")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> updateAssignmentStatus(
            @PathVariable("assignmentId") Long assignmentId,
            @RequestParam("status") String status) {
        return marketService.updateAssignmentStatus(assignmentId, status)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Updated stall status successfully.", result)));
    }

    @Operation(summary = "Admin removes stall allocation", description = "Removes farmer stall allocation from market.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/markets/assignments/{assignmentId:[0-9]+}")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> deleteAssignment(
            @PathVariable("assignmentId") Long assignmentId) {
        return marketService.deleteAssignment(assignmentId)
                .map(result -> ResponseEntity.ok(ApiResponse.success("Removed stall allocation successfully.", result)));
    }
}
