$authFarmer = @{ email = 'farmer@marketlink.vn'; password = 'Farmer@123' } | ConvertTo-Json
$farmerRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $authFarmer -ContentType 'application/json'
$farmerToken = if ($farmerRes.accessToken) { $farmerRes.accessToken } else { $farmerRes.token }
$farmerHeaders = @{ Authorization = 'Bearer ' + $farmerToken }

# 1. Create a Cutoff Setting for farmer 90 (Market 101, Saturday = 6, cutoff 12 hours before)
$cutoffBody = @{
  marketId = 101
  dayOfWeek = 6
  cutoffHoursBefore = 12
} | ConvertTo-Json

try {
  $savedCutoff = Invoke-RestMethod -Uri 'http://localhost:8081/api/farmer/cutoff-settings' -Method Post -Headers $farmerHeaders -Body $cutoffBody -ContentType 'application/json'
  Write-Host ('[SUCCESS] Saved cutoff setting ID: ' + $savedCutoff.data.settingId)
} catch {
  Write-Host ('[ERROR] Saved cutoff setting failed: ' + $_.Exception.Message)
}

# 2. Create a Weekly Stock Template (Product 101, Market 101, Saturday = 6, qty = 30)
$stockTemplateBody = @{
  productId = 101
  marketId = 101
  dayOfWeek = 6
  recurringQuantity = 30.0
  isActive = $true
} | ConvertTo-Json

try {
  $savedTemplate = Invoke-RestMethod -Uri 'http://localhost:8081/api/farmer/stock-templates' -Method Post -Headers $farmerHeaders -Body $stockTemplateBody -ContentType 'application/json'
  Write-Host ('[SUCCESS] Saved stock template ID: ' + $savedTemplate.data.templateId)
} catch {
  Write-Host ('[ERROR] Saved stock template failed: ' + $_.Exception.Message)
}

# 3. Create a Review using Customer account
$authCustomer = @{ email = 'customer@marketlink.vn'; password = 'Customer@123' } | ConvertTo-Json
$custRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $authCustomer -ContentType 'application/json'
$custToken = if ($custRes.accessToken) { $custRes.accessToken } else { $custRes.token }
$custHeaders = @{ Authorization = 'Bearer ' + $custToken }

$reviewBody = @{
  orderId = 101
  farmerId = 90
  productId = 101
  rating = 5
  comment = 'Rau cai bo xoi cua bac Ba rat tuoi va non, dong goi can than nhan dung ca sang tai sap cho Tay Ho.'
} | ConvertTo-Json

try {
  $savedReview = Invoke-RestMethod -Uri 'http://localhost:8081/api/customer/reviews' -Method Post -Headers $custHeaders -Body $reviewBody -ContentType 'application/json'
  Write-Host ('[SUCCESS] Customer created review ID: ' + $savedReview.data.reviewId)
  $revId = $savedReview.data.reviewId

  # 4. Farmer replies to this review
  $replyBody = @{
    farmerReply = 'Cam on ban da tin tuong ung ho nong san huu co cua sap Ba Vi! Hen gap lai ban vao phien cho cuoi tuan nay nhe.'
  } | ConvertTo-Json

  $replied = Invoke-RestMethod -Uri ('http://localhost:8081/api/farmer/reviews/' + $revId + '/reply') -Method Post -Headers $farmerHeaders -Body $replyBody -ContentType 'application/json'
  Write-Host ('[SUCCESS] Farmer replied to review: ' + $replied.data.farmerReply)
} catch {
  Write-Host ('[INFO] Review flow note: ' + $_.Exception.Message)
}
