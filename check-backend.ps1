
try {
    $response = Invoke-RestMethod -Uri "https://alphery-os-backend.onrender.com/admin/check-user/AU000001" -Method Get
    Write-Host "✅ Backend is UP and accessible!"
    Write-Host "User Status:"
    $response | Format-List
} catch {
    Write-Host "❌ Backend check failed: $_"
}
