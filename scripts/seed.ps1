<#
.SYNOPSIS
    Seeds generic sample resources and tomorrow's slots in Reserve Service.
.PARAMETER TargetUrl
    The base URL of the running backend. Default: http://localhost:8080
.EXAMPLE
    .\scripts\seed.ps1
    .\scripts\seed.ps1 -TargetUrl http://localhost:8080
#>
param(
    [string]$TargetUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🌱 Seeding demo data against $TargetUrl..." -ForegroundColor Cyan

# Check health
try {
    $health = Invoke-RestMethod -Uri "$TargetUrl/actuator/health" -Method Get
    Write-Host "Backend status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Error "❌ Could not reach backend at $TargetUrl. Please start the service first."
    exit 1
}

function Get-TomorrowUtc([int]$Hour, [int]$Minute = 0) {
    $now = [DateTime]::UtcNow.Date.AddDays(1)
    $dt = [DateTime]::SpecifyKind($now.AddHours($Hour).AddMinutes($Minute), [DateTimeKind]::Utc)
    return $dt.ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$sampleResources = @(
    @{
        Name = "Executive Boardroom Alpha"
        Type = "ROOM"
        Metadata = @{
            capacity = 12
            floor = 4
            features = @("4K Display", "Video Conferencing", "Whiteboard")
            requiresKeycard = $true
        }
        Slots = @(
            @{ StartTime = Get-TomorrowUtc 9 0; EndTime = Get-TomorrowUtc 10 0; Capacity = 1 },
            @{ StartTime = Get-TomorrowUtc 10 30; EndTime = Get-TomorrowUtc 11 30; Capacity = 1 },
            @{ StartTime = Get-TomorrowUtc 14 0; EndTime = Get-TomorrowUtc 15 0; Capacity = 1 }
        )
    },
    @{
        Name = "Advisory Consultant - Jordan"
        Type = "SERVICE_PROVIDER"
        Metadata = @{
            department = "Architecture & Strategy"
            location = "Virtual / Remote"
            languages = @("English", "German")
            active = $true
        }
        Slots = @(
            @{ StartTime = Get-TomorrowUtc 11 0; EndTime = Get-TomorrowUtc 12 0; Capacity = 1 },
            @{ StartTime = Get-TomorrowUtc 13 0; EndTime = Get-TomorrowUtc 14 0; Capacity = 1 },
            @{ StartTime = Get-TomorrowUtc 15 30; EndTime = Get-TomorrowUtc 16 30; Capacity = 1 }
        )
    },
    @{
        Name = "Studio Masterclass: High Performance Systems"
        Type = "CLASS"
        Metadata = @{
            maxCapacity = 20
            level = "Intermediate to Advanced"
            prerequisites = @("Distributed Systems Basics")
            materialsProvided = $true
        }
        Slots = @(
            @{ StartTime = Get-TomorrowUtc 16 0; EndTime = Get-TomorrowUtc 17 30; Capacity = 20 },
            @{ StartTime = Get-TomorrowUtc 18 0; EndTime = Get-TomorrowUtc 19 30; Capacity = 20 }
        )
    }
)

foreach ($res in $sampleResources) {
    Write-Host "`nCreating resource `"$($res.Name)`" [$($res.Type)]..." -ForegroundColor Yellow
    $resBody = @{
        name = $res.Name
        type = $res.Type
        metadata = $res.Metadata
    } | ConvertTo-Json -Depth 5

    $createdResource = Invoke-RestMethod -Uri "$TargetUrl/api/resources" -Method Post -Body $resBody -ContentType "application/json"
    Write-Host "  ✓ Resource ID: $($createdResource.id)" -ForegroundColor Green

    foreach ($slot in $res.Slots) {
        try {
            $slotBody = @{
                startTime = $slot.StartTime
                endTime = $slot.EndTime
                capacity = $slot.Capacity
            } | ConvertTo-Json

            $createdSlot = Invoke-RestMethod -Uri "$TargetUrl/api/resources/$($createdResource.id)/slots" -Method Post -Body $slotBody -ContentType "application/json"
            Write-Host "  ✓ Slot: $($createdSlot.startTime) - $($createdSlot.endTime) (Capacity: $($createdSlot.capacity))" -ForegroundColor Green
        } catch {
            Write-Warning "  Slot error: $_"
        }
    }
}

Write-Host "`n✨ Demo data seeding finished successfully!`n" -ForegroundColor Cyan
