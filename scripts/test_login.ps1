$body = @{
    email = "farmer.bavi@marketlink.vn"
    password = "MarketLink@123"
} | ConvertTo-Json

try {
    $res = Invoke-WebRequest -Uri "http://localhost:5173/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Output "Status: $($res.StatusCode)"
    Write-Output $res.Content
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Output "Response body: $($reader.ReadToEnd())"
    }
}
