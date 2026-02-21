# Payment Verification Test Script
# Usage: .\test-payment.ps1 -MerchantId "your-uid" -Amount 500

param(
    [Parameter(Mandatory=$true)]
    [string]$MerchantId,
    
    [Parameter(Mandatory=$true)]
    [decimal]$Amount
)

Write-Host "🧪 Testing Payment Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Merchant ID: $MerchantId" -ForegroundColor Yellow
Write-Host "Amount: ₹$Amount" -ForegroundColor Yellow
Write-Host ""

# Create SMS text
$smsText = "Rs.$Amount credited to your account on $(Get-Date -Format 'dd-MMM-yyyy'). UPI Ref: TEST$(Get-Random -Minimum 100000 -Maximum 999999)"

Write-Host "📱 Simulating SMS:" -ForegroundColor Green
Write-Host $smsText -ForegroundColor White
Write-Host ""

# Prepare request body
$body = @{
    merchantId = $MerchantId
    smsText = $smsText
} | ConvertTo-Json

# Send request
try {
    Write-Host "📤 Sending to backend..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/submit-sms" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
    if ($response.success) {
        Write-Host ""
        Write-Host "🎉 SUCCESS! Payment verified automatically!" -ForegroundColor Green
        Write-Host "Payment ID: $($response.paymentId)" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "⚠️  No matching payment found" -ForegroundColor Yellow
        Write-Host "Message: $($response.message)" -ForegroundColor White
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor Cyan
        Write-Host "1. No payment exists with amount ₹$Amount" -ForegroundColor White
        Write-Host "2. Payment is not in WAITING_FOR_SMS status" -ForegroundColor White
        Write-Host "3. Payment was created more than 5 minutes ago" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Cyan
    Write-Host "1. Backend server is running on port 3001" -ForegroundColor White
    Write-Host "2. Run: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
