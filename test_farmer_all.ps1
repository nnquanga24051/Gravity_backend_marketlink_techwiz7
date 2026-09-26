$authBody = @{ email = 'farmer@marketlink.vn'; password = 'Farmer@123' } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $authBody -ContentType 'application/json'
$token = if ($authRes.accessToken) { $authRes.accessToken } elseif ($authRes.token) { $authRes.token } else { $authRes.data.accessToken }
Write-Host "Token retrieved: $($token.Substring(0, 20))..."

$headers = @{ Authorization = "Bearer $token" }

$endpoints = @(
  '/api/farmer/orders/summary',
  '/api/farmer/orders',
  '/api/farmer/products',
  '/api/farmer/pickup-slots',
  '/api/farmer/cutoff-settings',
  '/api/farmer/stock-templates',
  '/api/farmer/markets/my-assignments',
  '/api/farmer/kyc/my-documents',
  '/api/reviews/farmer/90'
)

foreach ($ep in $endpoints) {
  try {
    $res = Invoke-RestMethod -Uri ("http://localhost:8081" + $ep) -Method Get -Headers $headers
    $dataCount = if ($res.data -is [System.Array]) { $res.data.Count } elseif ($res -is [System.Array]) { $res.Count } else { "Object OK" }
    Write-Host ("[SUCCESS] " + $ep + " -> " + $dataCount)
  } catch {
    Write-Host ("[ERROR] " + $ep + " -> " + $_.Exception.Message)
  }
}
