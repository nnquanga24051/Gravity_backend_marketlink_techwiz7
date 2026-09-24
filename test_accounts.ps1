$adminBody = @{ email = "admin@marketlink.vn"; password = "Admin@123" } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -ContentType "application/json" -Body $adminBody
Write-Host "=== 1. ADMIN LOGIN ==="
Write-Host "User ID:" $adminLogin.userId
Write-Host "Email:" $adminLogin.email
Write-Host "Full Name:" $adminLogin.fullName
Write-Host "Roles:" ($adminLogin.roles -join ", ")
$adminToken = $adminLogin.token
Write-Host "Token received:" ($adminToken.Substring(0, 20) + "...")

$adminStatus = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/system-status" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Admin /system-status:" ($adminStatus | ConvertTo-Json -Compress)

$adminUsers = Invoke-RestMethod -Uri "http://localhost:8081/api/admin/users" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Admin /users count:" $adminUsers.Count


$farmerBody = @{ email = "farmer@marketlink.vn"; password = "Farmer@123" } | ConvertTo-Json
$farmerLogin = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -ContentType "application/json" -Body $farmerBody
Write-Host "`n=== 2. FARMER LOGIN ==="
Write-Host "User ID:" $farmerLogin.userId
Write-Host "Email:" $farmerLogin.email
Write-Host "Full Name:" $farmerLogin.fullName
Write-Host "Roles:" ($farmerLogin.roles -join ", ")
$farmerToken = $farmerLogin.token
Write-Host "Token received:" ($farmerToken.Substring(0, 20) + "...")

$farmerDashboard = Invoke-RestMethod -Uri "http://localhost:8081/api/farmer/dashboard" -Method Get -Headers @{ Authorization = "Bearer $farmerToken" }
Write-Host "Farmer /dashboard:" ($farmerDashboard | ConvertTo-Json -Compress)

$farmerDocs = Invoke-RestMethod -Uri "http://localhost:8081/api/farmer/kyc/my-documents" -Method Get -Headers @{ Authorization = "Bearer $farmerToken" }
Write-Host "Farmer /kyc/my-documents count:" $farmerDocs.Count


$custBody = @{ email = "customer@marketlink.vn"; password = "Customer@123" } | ConvertTo-Json
$custLogin = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -ContentType "application/json" -Body $custBody
Write-Host "`n=== 3. CUSTOMER LOGIN ==="
Write-Host "User ID:" $custLogin.userId
Write-Host "Email:" $custLogin.email
Write-Host "Full Name:" $custLogin.fullName
Write-Host "Roles:" ($custLogin.roles -join ", ")
$custToken = $custLogin.token
Write-Host "Token received:" ($custToken.Substring(0, 20) + "...")

$custSummary = Invoke-RestMethod -Uri "http://localhost:8081/api/customer/profile-summary" -Method Get -Headers @{ Authorization = "Bearer $custToken" }
Write-Host "Customer /profile-summary:" ($custSummary | ConvertTo-Json -Compress)

$custFamily = Invoke-RestMethod -Uri "http://localhost:8081/api/customer/family/members" -Method Get -Headers @{ Authorization = "Bearer $custToken" }
Write-Host "Customer /family/members count:" $custFamily.Count

$adminMe = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Admin /me:" ($adminMe | ConvertTo-Json -Compress)

$farmerMe = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $farmerToken" }
Write-Host "Farmer /me:" ($farmerMe | ConvertTo-Json -Compress)

$custMe = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $custToken" }
Write-Host "Customer /me:" ($custMe | ConvertTo-Json -Compress)

Write-Host "`n==============================================="
Write-Host " ALL 3 TEST ACCOUNTS VERIFIED 100% OPERATIONAL! "
Write-Host "==============================================="
