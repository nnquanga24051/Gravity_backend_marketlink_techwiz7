# ===================================================================
# Script Kiểm thử AI Assistant Chatbot (MarketLink)
# ===================================================================
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       KIỂM THỬ AI ASSISTANT CHATBOT - MARKETLINK         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$testQueries = @(
    "Chợ nào mở vào Chủ nhật và có bán rau sạch không?",
    "Giá cà chua bi hiện tại là bao nhiêu?",
    "Tôi muốn mua xà lách thủy canh vào thứ 7 thì đi chợ nào?"
)

foreach ($query in $testQueries) {
    Write-Host "`n>>> [CÂU HỎI]: $query" -ForegroundColor Yellow
    $body = @{ message = $query } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8081/api/ai/chat" -Method Post -ContentType "application/json; charset=utf-8" -Body $body
        Write-Host "[TRỢ LÝ AI TRẢ LỜI]:" -ForegroundColor Green
        Write-Host $response.reply
        
        if ($response.relevantMarkets -and $response.relevantMarkets.Count -gt 0) {
            Write-Host "`n* Chợ liên quan:" -ForegroundColor Cyan
            foreach ($m in $response.relevantMarkets) { Write-Host "  - $m" }
        }
        
        if ($response.relevantProducts -and $response.relevantProducts.Count -gt 0) {
            Write-Host "* Nông sản liên quan:" -ForegroundColor Cyan
            foreach ($p in $response.relevantProducts) { Write-Host "  - $p" }
        }
        
        if ($response.timingNotes) {
            Write-Host "* Lưu ý đặt hàng: $($response.timingNotes)" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "[LỖI KẾT NỐI]: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "-> Gợi ý: Hãy bấm RESTART lại ứng dụng Spring Boot để nạp Controller mới tạo!" -ForegroundColor Yellow
        }
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
}
