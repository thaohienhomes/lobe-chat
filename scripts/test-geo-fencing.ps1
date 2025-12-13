<#
.SYNOPSIS
    Test Geo-Fencing Detection for Pho.chat Production
    
.DESCRIPTION
    This script tests the /api/pricing/geo endpoint to verify
    geo-detection is working correctly on production.
    
.NOTES
    Based on PRICING_MASTERPLAN.md.md geo-fencing requirements
    Vietnam (VN) -> Sepay, VND
    Global (other countries) -> Polar, USD
#>

param(
    [string]$BaseUrl = "https://pho.chat",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pho.chat Geo-Fencing Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic API endpoint accessibility
Write-Host "[Test 1] Testing API endpoint accessibility..." -ForegroundColor Yellow
try {
    $geoUrl = "$BaseUrl/api/pricing/geo"
    Write-Host "  URL: $geoUrl"
    
    $response = Invoke-WebRequest -Uri $geoUrl -UseBasicParsing -TimeoutSec 30
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200) {
        Write-Host "  ✅ Status: $statusCode OK" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "  📍 Geo Detection Results:" -ForegroundColor Cyan
        Write-Host "     Country Code: $($content.countryCode)" -ForegroundColor White
        Write-Host "     Region: $($content.region)" -ForegroundColor White
        Write-Host "     Currency: $($content.currency)" -ForegroundColor White
        Write-Host "     Is Vietnam: $($content.isVietnam)" -ForegroundColor White
        Write-Host "     Payment Provider: $($content.paymentProvider)" -ForegroundColor White
        
        # Validate expected behavior
        Write-Host ""
        Write-Host "  🔍 Validation:" -ForegroundColor Cyan
        
        if ($content.countryCode -eq "VN") {
            if ($content.region -eq "vietnam" -and $content.currency -eq "VND" -and $content.paymentProvider -eq "sepay") {
                Write-Host "     ✅ Vietnam detection: CORRECT" -ForegroundColor Green
            }
            else {
                Write-Host "     ❌ Vietnam detection: INCORRECT" -ForegroundColor Red
                Write-Host "        Expected: region=vietnam, currency=VND, provider=sepay" -ForegroundColor Red
            }
        }
        else {
            if ($content.region -eq "global" -and $content.currency -eq "USD" -and $content.paymentProvider -eq "polar") {
                Write-Host "     ✅ Global detection: CORRECT" -ForegroundColor Green
            }
            else {
                Write-Host "     ❌ Global detection: INCORRECT" -ForegroundColor Red  
                Write-Host "        Expected: region=global, currency=USD, provider=polar" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "  ❌ Unexpected status: $statusCode" -ForegroundColor Red
    }
}
catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($Verbose) {
        Write-Host "  Details: $_" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 2: Check webhook endpoints accessibility  
Write-Host "[Test 2] Testing webhook endpoints..." -ForegroundColor Yellow

$webhooks = @(
    @{ Name = "Sepay Webhook"; Url = "$BaseUrl/api/sepay/webhook" },
    @{ Name = "Polar Webhook"; Url = "$BaseUrl/api/payment/polar/webhook" }
)

foreach ($webhook in $webhooks) {
    try {
        Write-Host "  Testing: $($webhook.Name)"
        $response = Invoke-WebRequest -Uri $webhook.Url -Method GET -UseBasicParsing -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "    ✅ Accessible (GET returns 200)" -ForegroundColor Green
        }
        else {
            Write-Host "    ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 405) {
            Write-Host "    ✅ Endpoint exists (405 Method Not Allowed for GET)" -ForegroundColor Green
        }
        elseif ($statusCode -eq 401 -or $statusCode -eq 400) {
            Write-Host "    ✅ Endpoint exists (requires valid signature)" -ForegroundColor Green
        }
        else {
            Write-Host "    ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Use VPN to test from different countries" -ForegroundColor White
Write-Host "   2. Check Vercel logs for any errors" -ForegroundColor White
Write-Host "   3. Verify pricing cards display correctly" -ForegroundColor White

