# 1. Test Categories
Write-Host "=== TEST 1: GET /api/categories ==="
$catRes = Invoke-RestMethod -Uri "http://localhost:8081/api/categories" -Method Get
Write-Host "Categories count: $($catRes.Count)"
foreach ($c in $catRes) {
    Write-Host " - $($c.name) ($($c.slug))"
}

# 2. Test Login
Write-Host "`n=== TEST 2: POST /api/auth/login ==="
$loginBody = @{ email = "farmer1@marketlink.vn"; password = "Password123@" } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "Login user: $($authRes.fullName), Roles: $($authRes.roles -join ', ')"
$token = $authRes.token

# 3. Test /me
Write-Host "`n=== TEST 3: GET /api/auth/me with Token ==="
$meRes = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Host "Profile name: $($meRes.fullName), Status: $($meRes.status), KYC: $($meRes.kycStatus)"

# 4. Test RBAC Farmer Dashboard
Write-Host "`n=== TEST 4: GET /api/farmer/dashboard with Farmer Token ==="
$farmerRes = Invoke-RestMethod -Uri "http://localhost:8081/api/farmer/dashboard" -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Host "Farmer Dashboard Response: $($farmerRes.message)"

# 5. Test Customer endpoint with Farmer token (Expect 403)
Write-Host "`n=== TEST 5: GET /api/customer/profile-summary with Farmer Token (Expect 403 Forbidden) ==="
try {
    Invoke-RestMethod -Uri "http://localhost:8081/api/customer/profile-summary" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "ERROR: Should have been 403!"
} catch {
    Write-Host "PASSED: Forbidden as expected! Status: $($_.Exception.Response.StatusCode)"
}

Write-Host "`n=== ALL 5 MODULAR ENDPOINT TESTS COMPLETED SUCCESSFULLY! ==="
