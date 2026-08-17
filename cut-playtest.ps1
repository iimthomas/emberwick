# =============================================================================
#  CUT A PLAYTEST DROP  ->  prototype/play/
# =============================================================================
#  Emberwick ships two builds from one repo:
#
#    /emberwick/play/   LOCKED   what friends bookmark and install. Only ever
#                                changes when this script is run.
#    /emberwick/        LIVE     the working build. Changes with every push.
#
#  So Thomas can keep developing in the open without the game shifting under a
#  tester mid-run. A drop is a COPY, not a branch: nothing to merge, nothing to
#  rebase, and the snapshot keeps whatever ?v= it was cut at.
#
#  The dev tools (solver.html / solver.js / measure.js) are deliberately NOT
#  copied -- the playtest build has no bot and no measurement rig.
#
#  Usage, from prototype/ :
#      ./cut-playtest.ps1
#      git add -A ; git commit -m "Playtest drop: build NNN" ; git push
# =============================================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dest = Join-Path $root 'play'

# The shipped game, and nothing else.
$files = @(
  'index.html',
  'game.js',
  'style.css',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
)

# The art, which is NOT a flat file list.
# ⚠️ ADDED 2026-08-12, and it was missing for two builds. Art paths are RELATIVE
# (`art/foes/<slug>.png`), so from /play/ they resolve to /emberwick/play/art/...
# -- and `foeArt()` removes an image that fails to load, silently and by design.
# A drop without this folder is not a broken drop, it is a drop where every
# creature quietly has no picture and nothing anywhere says so.
# 🔑 The same trap as the tutorial's missing art: a COPY LIST written before the
# thing existed. When you add a new kind of asset, find every list that enumerates
# what ships.
# Dev tools inside art/ (keyalpha.ps1, sizeplace.ps1) are deliberately excluded.
$artDirs = @('foes', 'places', 'hero')

foreach ($f in $files) {
  $p = Join-Path $root $f
  if (-not (Test-Path $p)) { throw "MISSING: $f -- refusing to cut a partial drop." }
}
foreach ($d in $artDirs) {
  $p = Join-Path $root "art\$d"
  if (-not (Test-Path $p)) { throw "MISSING: art\$d -- refusing to cut a partial drop." }
}

if (-not (Test-Path $dest)) { New-Item -ItemType Directory $dest | Out-Null }

# Read the build number off index.html's own cache-buster: that IS the version
# a browser runs, so it can never drift from what the drop actually contains.
$html  = Get-Content (Join-Path $root 'index.html') -Raw
$build = if ($html -match 'game\.js\?v=(\d+)') { $Matches[1] } else { '?' }

# Clear the folder first, so a file deleted upstream does not survive in the drop.
# ⚠️ -Recurse as well now: the art folder has to go too, or a creature whose plate was
# regenerated or renamed upstream keeps its old picture in the frozen copy forever.
Get-ChildItem $dest -File | Remove-Item -Force
if (Test-Path (Join-Path $dest 'art')) { Remove-Item (Join-Path $dest 'art') -Recurse -Force }
foreach ($f in $files) { Copy-Item (Join-Path $root $f) (Join-Path $dest $f) -Force }

New-Item -ItemType Directory (Join-Path $dest 'art') -Force | Out-Null
foreach ($d in $artDirs) {
  Copy-Item (Join-Path $root "art\$d") (Join-Path $dest 'art') -Recurse -Force
}
$artCount = (Get-ChildItem (Join-Path $dest 'art') -Recurse -File).Count

# A note in the folder, so nobody edits the frozen copy by mistake.
@"
This folder is a FROZEN SNAPSHOT of the game, cut from the live build.

    playtest build $build

Do not edit anything in here -- it is overwritten wholesale the next time
cut-playtest.ps1 runs. Change the real files in prototype/ and cut a new drop.

  friends   https://iimthomas.github.io/emberwick/play/
  live      https://iimthomas.github.io/emberwick/         (?dev for tools)
"@ | Out-File (Join-Path $dest 'DO-NOT-EDIT.txt') -Encoding utf8

Write-Host ""
Write-Host "  Playtest drop cut: build $build" -ForegroundColor Green
Write-Host "  -> $dest"
Write-Host "  $($files.Count) files + $artCount art assets. Dev tools excluded."
Write-Host ""
Write-Host "  Now:  git add -A ; git commit -m `"Playtest drop: build $build`" ; git push"
Write-Host ""
