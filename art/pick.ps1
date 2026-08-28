# =============================================================================
#  PICK BETWEEN TWO TAKES OF THE SAME PLATE
# =============================================================================
#  Forty of this batch's subjects were generated at two takes each before Thomas
#  said "i don't want to be picking every time". That leaves eighty images and no
#  reviewer. Presenting them all would hand the job straight back to him.
#
#  🔑 SO THE PICKER IS THE FROZEN PROMPT'S OWN RULES, READ BACK OFF THE PIXELS.
#  Every criterion below is a line already written in Art_Direction_Locked.md, so
#  this scores obedience to the brief, not taste:
#
#    PLACES  - "the distance is brightest and most open toward the UPPER RIGHT"
#              and "keep the lower-left third simple and uncluttered". Score is
#              upper-right luminance minus lower-left busyness.
#
#    FOES    - "entirely visible and not cropped at any edge, generous empty
#              black margin all around". Score punishes any subject pixel on the
#              border ring, then prefers the larger subject, because a plate that
#              obeys the frame is worth more than one that fills it.
#
#  ⚠️ THIS IS NOT AN AESTHETIC JUDGEMENT AND MUST NOT BE DESCRIBED AS ONE. It
#  cannot see whether the anatomy read, whether the palette held, or whether the
#  thing is beautiful. It can only see whether the plate did what it was told. If
#  a shipped picture is wrong, the fix is to look at it, not to tune this.
#
#  Usage:  ./pick.ps1 -Raw <folder> [-Report picks.tsv]
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$Raw,
  [string]$Report = ''
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$cs = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class PlateScore {

  // luminance grid, subsampled - the scores are all regional averages, so full
  // resolution buys nothing but time
  static int[,] Grid(Bitmap src, int step, out int gw, out int gh) {
    int w = src.Width, h = src.Height;
    gw = w / step; gh = h / step;
    int[,] L = new int[gw, gh];
    BitmapData d = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    int bytes = Math.Abs(d.Stride) * h;
    byte[] buf = new byte[bytes];
    Marshal.Copy(d.Scan0, buf, 0, bytes);
    src.UnlockBits(d);
    for (int gy = 0; gy < gh; gy++)
      for (int gx = 0; gx < gw; gx++) {
        int p = (gy * step) * d.Stride + (gx * step) * 4;
        L[gx, gy] = (buf[p + 2] * 30 + buf[p + 1] * 59 + buf[p] * 11) / 100;
      }
    return L;
  }

  // PLACES: bright open distance up-right, quiet ground down-left.
  public static double Place(Bitmap src) {
    int gw, gh;
    int[,] L = Grid(src, 4, out gw, out gh);
    // upper-right quadrant mean brightness
    double bright = 0; int nb = 0;
    for (int gy = 0; gy < gh / 2; gy++)
      for (int gx = gw / 2; gx < gw; gx++) { bright += L[gx, gy]; nb++; }
    bright /= Math.Max(1, nb);
    // lower-left third busyness: mean absolute neighbour difference
    double busy = 0; int nc = 0;
    for (int gy = gh * 2 / 3; gy < gh - 1; gy++)
      for (int gx = 1; gx < gw / 3; gx++) {
        busy += Math.Abs(L[gx, gy] - L[gx - 1, gy]) + Math.Abs(L[gx, gy] - L[gx, gy + 1]);
        nc++;
      }
    busy /= Math.Max(1, nc);
    // 🔑 the two terms are weighted so neither alone decides: a blazing sky cannot
    // buy a cluttered foreground, and a bare foreground cannot buy a dead sky.
    return bright - 2.0 * busy;
  }

  // FOES: nothing may touch the edge; then bigger is better.
  public static double Foe(Bitmap src, out double borderPct, out double subjPct) {
    int gw, gh;
    int[,] L = Grid(src, 4, out gw, out gh);
    const int TH = 14;                       // the same black threshold keyalpha uses
    int border = 0, borderTot = 0, subj = 0, tot = 0;
    for (int gy = 0; gy < gh; gy++)
      for (int gx = 0; gx < gw; gx++) {
        bool lit = L[gx, gy] > TH;
        if (lit) subj++;
        tot++;
        // a two-cell band, not a single line: the model often leaves one dark
        // pixel of courtesy margin and still runs the art into the edge
        if (gx < 2 || gy < 2 || gx >= gw - 2 || gy >= gh - 2) {
          borderTot++;
          if (lit) border++;
        }
      }
    borderPct = 100.0 * border / Math.Max(1, borderTot);
    subjPct = 100.0 * subj / Math.Max(1, tot);
    // a plate that leaves the frame is disqualified in practice, so the penalty
    // is an order of magnitude larger than the size term can ever be
    return -20.0 * borderPct + subjPct;
  }
}
"@
Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Drawing

$files = Get-ChildItem (Join-Path $Raw '*__*.png')
$groups = $files | Group-Object { ($_.BaseName -split '__')[0] }
$lines = @()

foreach ($g in $groups) {
  if ($g.Count -lt 2) { continue }
  $kind = if ((Get-Content (Join-Path $Raw 'kinds.txt') | Where-Object { $_ -like "$($g.Name)`t*" }) -match 'place') { 'place' } else { 'foe' }
  $best = $null; $bestScore = [double]::NegativeInfinity; $detail = @()
  foreach ($f in ($g.Group | Sort-Object Name)) {
    $img = [System.Drawing.Bitmap]::FromFile($f.FullName)
    if ($kind -eq 'place') {
      $s = [PlateScore]::Place($img)
      $detail += ("{0}={1:N1}" -f $f.BaseName, $s)
    } else {
      $bp = 0.0; $sp = 0.0
      $s = [PlateScore]::Foe($img, [ref]$bp, [ref]$sp)
      $detail += ("{0}=(edge {1:N1}% size {2:N1}%)" -f $f.BaseName, $bp, $sp)
    }
    $img.Dispose()
    if ($s -gt $bestScore) { $bestScore = $s; $best = $f.BaseName }
  }
  $take = ($best -split '__')[1]
  Write-Host ("  {0,-24} -> take {1}   {2}" -f $g.Name, $take, ($detail -join '  '))
  $lines += ("{0}`t{1}`t{2}" -f $g.Name, $take, $kind)
}

if ($Report) { $lines | Set-Content -Path $Report -Encoding utf8 }
Write-Host ("picked {0} of {1} two-take subjects" -f $lines.Count, $groups.Count)
