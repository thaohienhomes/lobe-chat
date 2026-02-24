$baseUrl = "http://localhost:3010"

Write-Host "`n===== PubMed Search Test =====" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/plugins/pubmed/search?query=metformin+diabetes&maxResults=3" -UseBasicParsing -TimeoutSec 15
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Total results: $($json.totalResults)"
    foreach ($a in $json.articles) {
        Write-Host "  - [$($a.pmid)] $($a.title)" -ForegroundColor Yellow
        Write-Host "    Journal: $($a.journal) | DOI: $($a.doi)"
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== Drug Interaction Check (Warfarin + Aspirin) =====" -ForegroundColor Cyan
try {
    $body = '{"drug1":"warfarin","drug2":"aspirin"}'
    $r = Invoke-WebRequest -Uri "$baseUrl/api/plugins/drug-interactions/check" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Has interaction: $($json.hasInteraction)"
    Write-Host "Drug1: $($json.drug1), Drug2: $($json.drug2)"
    foreach ($i in $json.interactions) {
        Write-Host "  - [$($i.severity)] $($i.description)" -ForegroundColor Yellow
    }
    Write-Host "Recommendation: $($json.recommendation)" -ForegroundColor Magenta
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== Drug Interaction Check (Metformin + Lisinopril) =====" -ForegroundColor Cyan
try {
    $body = '{"drug1":"metformin","drug2":"lisinopril"}'
    $r = Invoke-WebRequest -Uri "$baseUrl/api/plugins/drug-interactions/check" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Has interaction: $($json.hasInteraction)"
    if ($json.interactions) {
        foreach ($i in $json.interactions) {
            Write-Host "  - [$($i.severity)] $($i.description)" -ForegroundColor Yellow
        }
    }
    Write-Host "Recommendation: $($json.recommendation)" -ForegroundColor Magenta
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== ArXiv Search (Medical AI) =====" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/plugins/arxiv/search?query=medical+AI+diagnosis&maxResults=3" -UseBasicParsing -TimeoutSec 15
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Total results: $($json.totalResults)"
    foreach ($p in $json.papers) {
        Write-Host "  - [$($p.arxivId)] $($p.title)" -ForegroundColor Yellow
        Write-Host "    Authors: $($p.authors -join ', ')"
        Write-Host "    PDF: $($p.pdfUrl)"
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== Health Check =====" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Overall: $($json.status) | Latency: $($json.totalLatencyMs)ms"
    Write-Host "DB: ok=$($json.checks.database.ok) ($($json.checks.database.latencyMs)ms)"
    Write-Host "Cache: ok=$($json.checks.cache.ok)"
    Write-Host "AI: ok=$($json.checks.ai_gateway.ok)"
    Write-Host "Auth: ok=$($json.checks.auth.ok)"
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== ALL TESTS COMPLETE =====" -ForegroundColor Green
