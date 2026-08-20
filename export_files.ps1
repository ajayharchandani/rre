# export_files.ps1
$src = "C:\Users\harch\.gemini\antigravity-ide\scratch\rre-international"
$destDesktop = "C:\Users\harch\OneDrive\Desktop\rre-international"
$destDocs = "C:\Users\harch\Documents\rre-international"
$zipFile = "C:\Users\harch\OneDrive\Desktop\rre-international-source-code.zip"

Write-Host "Creating destination folders..."

if (Test-Path $destDesktop) {
    Remove-Item -Recurse -Force $destDesktop
}
if (Test-Path $destDocs) {
    Remove-Item -Recurse -Force $destDocs
}
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

New-Item -ItemType Directory -Force -Path $destDesktop | Out-Null
New-Item -ItemType Directory -Force -Path $destDocs | Out-Null

Write-Host "Copying files to Desktop..."
Get-ChildItem -Path $src -Exclude "node_modules" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $destDesktop -Recurse -Force
}

Write-Host "Copying files to Documents..."
Get-ChildItem -Path $src -Exclude "node_modules" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $destDocs -Recurse -Force
}

Write-Host "Creating ZIP archive on Desktop..."
Compress-Archive -Path (Get-ChildItem -Path $destDesktop) -DestinationPath $zipFile -Force

Write-Host "SUCCESS: All source files saved to local folders and ZIP created."
