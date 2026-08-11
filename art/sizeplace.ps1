# =============================================================================
#  SIZE A PAINTED BACKDROP FOR THE WEB
# =============================================================================
#  Places are backdrops, not cutouts: no keying, no alpha, just a downscale and
#  a JPEG. They are dimmed to ~62% in game and sit behind a scrim, so quality 84
#  is invisible in play and roughly a third of the bytes.
#
#  ⚠️ Do NOT darken the image here. The game dims it (`.place-img` opacity) so
#  the balance stays one number instead of a re-render -- baking the darkness in
#  once already produced mud.
#
#  Usage:  ./sizeplace.ps1 -Source raw.png -Name sunwarm-trail [-Width 1600]
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Name,
  [int]$Width = 1600,
  [int]$Quality = 84
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dst = Join-Path $PSScriptRoot "places\$Name.jpg"
$img = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
$h = [int]($img.Height * $Width / $img.Width)
$bmp = New-Object System.Drawing.Bitmap $Width, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $Width, $h)
$g.Dispose(); $img.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$p = New-Object System.Drawing.Imaging.EncoderParameters 1
$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
$bmp.Save($dst, $codec, $p)
$bmp.Dispose()

$f = Get-Item $dst
Write-Host ("  place -> {0}  ({1} x {2}, {3} KB)" -f $f.Name, $Width, $h, [int]($f.Length / 1KB))
