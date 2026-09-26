$authBody = @{ email = 'farmer@marketlink.vn'; password = 'Farmer@123' } | ConvertTo-Json
try {
  $authRes = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $authBody -ContentType 'application/json'
  Write-Host "LOGIN RESPONSE:"
  $authRes | ConvertTo-Json -Depth 5
  $token = $authRes.data.token
  if (-not $token) {
    $token = $authRes.data.accessToken
  }
  Write-Host "TOKEN IS: $token"
  $payload = $token.Split('.')[1]
  while ($payload.Length % 4 -ne 0) { $payload += '=' }
  $bytes = [System.Convert]::FromBase64String($payload)
  $json = [System.Text.Encoding]::UTF8.GetString($bytes)
  Write-Host "DECODED TOKEN:"
  Write-Host $json
} catch {
  Write-Host "LOGIN FAILED:" $_.Exception.Message
}
