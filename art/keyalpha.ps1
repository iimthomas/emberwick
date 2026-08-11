# =============================================================================
#  KEY A FLAT-BLACK PLATE TO REAL ALPHA
# =============================================================================
#  Our creature plates are drawn on pure black. This turns that background into
#  true transparency and writes a web-sized PNG with a real alpha channel.
#
#  ---------------------------------------------------------------------------
#  WHY THIS IS NOT A BRIGHTNESS THRESHOLD, AND NOT A PLAIN FLOOD FILL EITHER
#  ---------------------------------------------------------------------------
#  Measured on Cindermaw: the background sits at luminance 4-6, but 25% of the
#  pixels INSIDE the creature are below 10 and some are pure black. The dragon
#  is charcoal armour by design. So:
#
#    * A brightness key ("dark = transparent") dissolves the body outright.
#    * A plain flood fill from the border leaks through the gaps between scales
#      and hollows the creature out -- it looks see-through, which is exactly
#      what shipped in build 190.
#
#  What separates background from body is not COLOUR, it is THICKNESS. The
#  backdrop is a wide open region; the paths into the body are a few pixels
#  wide. So the fill only travels through channels wider than -Radius:
#
#    1. dark   = luminance <= Threshold                    (candidate background)
#    2. core   = dark eroded by Radius                     (thin necks vanish)
#    3. reach  = every THICK dark region, not only the one touching the border
#    4. bg     = reach dilated by Radius, clipped to dark  (restored to the edge)
#
#  Step 3 counts ENCLOSED pockets too, because a coiled creature encloses
#  negative space -- the hole inside a tail loop is background you can see
#  through, but no fill starting at the border can ever reach it. -HolePercent
#  is what tells a real gap from a deep shadow between the scales: a pocket
#  smaller than that is treated as part of the body.
#
#  Steps 2 and 4 are box morphology done with integral images, so the whole
#  thing is O(pixels) regardless of radius.
#
#  Edges are then feathered by scaling alpha with brightness on the boundary,
#  and the key runs at FULL resolution before downscaling so the alpha ramp
#  comes from real anti-aliased edges instead of interpolated ones.
#
#  Usage:
#    ./keyalpha.ps1 -Source raw.png -Dest ../art/foes/name.png [-Width 900]
#                   [-Threshold 14] [-Radius 6]
#
#  If a creature still looks see-through, RAISE -Radius (the leak channel is
#  wider than you thought). If a thin tail or wingtip gets cut off, LOWER it.
#  If an enclosed gap stays black, LOWER -HolePercent; if a shadow inside the
#  body punches through, RAISE it.
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Dest,
  [int]$Width = 900,
  [int]$Threshold = 14,
  [int]$Radius = 6,
  [double]$HolePercent = 0.05,
  [int]$EdgeFade = 0
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$cs = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public static class AlphaKey {

  // box-sum over a boolean field via integral image -- O(1) per pixel
  static int[] Integral(bool[] f, int w, int h) {
    int[] I = new int[(w + 1) * (h + 1)];
    for (int y = 0; y < h; y++) {
      int rowSum = 0;
      for (int x = 0; x < w; x++) {
        rowSum += f[y * w + x] ? 1 : 0;
        I[(y + 1) * (w + 1) + (x + 1)] = I[y * (w + 1) + (x + 1)] + rowSum;
      }
    }
    return I;
  }
  static int BoxSum(int[] I, int w, int h, int x, int y, int r) {
    int x0 = Math.Max(0, x - r), y0 = Math.Max(0, y - r);
    int x1 = Math.Min(w - 1, x + r), y1 = Math.Min(h - 1, y + r);
    return I[(y1 + 1) * (w + 1) + (x1 + 1)] - I[y0 * (w + 1) + (x1 + 1)]
         - I[(y1 + 1) * (w + 1) + x0] + I[y0 * (w + 1) + x0];
  }

  public static Bitmap Key(Bitmap src, int threshold, int radius, int minHole) {
    int w = src.Width, h = src.Height;
    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) { g.DrawImage(src, 0, 0, w, h); }

    BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int bytes = Math.Abs(d.Stride) * h;
    byte[] buf = new byte[bytes];
    Marshal.Copy(d.Scan0, buf, 0, bytes);

    // 1. candidate background: dark enough
    bool[] dark = new bool[w * h];
    int[] lum = new int[w * h];
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++) {
        int p = y * d.Stride + x * 4;
        int L = (buf[p + 2] * 30 + buf[p + 1] * 59 + buf[p] * 11) / 100;
        lum[y * w + x] = L;
        dark[y * w + x] = L <= threshold;
      }

    // 2. erode: a core pixel has NO bright pixel within radius, so any channel
    //    narrower than the radius disappears entirely
    bool[] notDark = new bool[w * h];
    for (int i = 0; i < dark.Length; i++) notDark[i] = !dark[i];
    int[] Ind = Integral(notDark, w, h);
    bool[] core = new bool[w * h];
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        core[y * w + x] = BoxSum(Ind, w, h, x, y, radius) == 0;

    // 3. every THICK dark region is background -- not just the one touching the
    //    border. A coiled creature encloses negative space (the hole inside the
    //    tail loop), and a border-only fill can never reach it, so those pockets
    //    stayed black. Enclosed regions therefore count too, provided they are
    //    big: minHole is what separates a real gap you can see through from a
    //    deep shadow between the scales, which must stay part of the body.
    bool[] reach = new bool[w * h];
    List<int> comp = new List<int>();
    Stack<int> st = new Stack<int>();
    for (int seed = 0; seed < core.Length; seed++) {
      if (reach[seed] || !core[seed]) continue;
      comp.Clear();
      bool touchesBorder = false;
      reach[seed] = true; st.Push(seed);
      while (st.Count > 0) {
        int i = st.Pop(); comp.Add(i);
        int x = i % w, y = i / w;
        if (x == 0 || y == 0 || x == w - 1 || y == h - 1) touchesBorder = true;
        if (x > 0)     Push(core, reach, st, w, x - 1, y);
        if (x < w - 1) Push(core, reach, st, w, x + 1, y);
        if (y > 0)     Push(core, reach, st, w, x, y - 1);
        if (y < h - 1) Push(core, reach, st, w, x, y + 1);
      }
      // an enclosed pocket that is too small is shadow, not a hole -- put it back
      if (!touchesBorder && comp.Count < minHole)
        for (int k = 0; k < comp.Count; k++) reach[comp[k]] = false;
    }

    // 4. dilate the reached core back out, clipped to dark -- restores the
    //    background right up against the creature without re-entering it
    int[] Ire = Integral(reach, w, h);
    bool[] bg = new bool[w * h];
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++)
        bg[y * w + x] = dark[y * w + x] && BoxSum(Ire, w, h, x, y, radius) > 0;

    // alpha, with a brightness-scaled feather on the boundary
    for (int y = 0; y < h; y++)
      for (int x = 0; x < w; x++) {
        int i = y * w + x, p = y * d.Stride + x * 4;
        if (bg[i]) { buf[p + 3] = 0; continue; }
        bool edge = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) ||
                    (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
        if (edge) {
          int a = lum[i] * 255 / Math.Max(1, threshold * 3);
          buf[p + 3] = (byte)Math.Min(255, Math.Max(40, a));
        }
      }

    Marshal.Copy(buf, 0, d.Scan0, bytes);
    bmp.UnlockBits(d);
    return bmp;
  }

  static void Push(bool[] core, bool[] reach, Stack<int> st, int w, int x, int y) {
    int i = y * w + x;
    if (reach[i] || !core[i]) return;
    reach[i] = true; st.Push(i);
  }
}
"@
Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Drawing

$img = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
$minHole = [int]($img.Width * $img.Height * $HolePercent / 100)
$keyed = [AlphaKey]::Key($img, $Threshold, $Radius, $minHole)
$img.Dispose()

$h = [int]($keyed.Height * $Width / $keyed.Width)
$out = New-Object System.Drawing.Bitmap $Width, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($keyed, 0, 0, $Width, $h)
$g.Dispose(); $keyed.Dispose()

# 🔥 EDGE FADE. If the artwork RUNS OFF the plate - the mage's spell exits the top-right
# corner at full brightness - the rectangle slices it, and a hard straight cut across a glow
# reads as a visible box in the scene. Ramping alpha to nothing over the outer band turns that
# slice into the light simply falling away. Only needed when something bleeds off the edge.
if ($EdgeFade -gt 0) {
  $fd = $out.LockBits((New-Object System.Drawing.Rectangle 0, 0, $out.Width, $out.Height),
        [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $len = [Math]::Abs($fd.Stride) * $out.Height
  $px = New-Object byte[] $len
  [System.Runtime.InteropServices.Marshal]::Copy($fd.Scan0, $px, 0, $len)
  for ($y = 0; $y -lt $out.Height; $y++) {
    $dy = [Math]::Min($y, $out.Height - 1 - $y)
    for ($x = 0; $x -lt $out.Width; $x++) {
      $dx = [Math]::Min($x, $out.Width - 1 - $x)
      $d = [Math]::Min($dx, $dy)
      if ($d -lt $EdgeFade) {
        $p = $y * $fd.Stride + $x * 4
        $px[$p + 3] = [byte]([int]$px[$p + 3] * $d / $EdgeFade)
      }
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($px, 0, $fd.Scan0, $len)
  $out.UnlockBits($fd)
}

$out.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)

# report how much of the frame was actually removed -- a sanity check that
# catches both failure modes: ~0% means nothing keyed, >85% means it ate the art
$clear = 0
for ($y = 0; $y -lt $out.Height; $y += 3) { for ($x = 0; $x -lt $out.Width; $x += 3) { if ($out.GetPixel($x, $y).A -lt 8) { $clear++ } } }
$tot = [math]::Ceiling($out.Height / 3) * [math]::Ceiling($out.Width / 3)
$pct = [int](100 * $clear / $tot)
$out.Dispose()

$f = Get-Item $Dest
Write-Host ("  keyed -> {0}  ({1} x {2}, {3} KB, {4}% transparent)" -f $f.Name, $Width, $h, [int]($f.Length / 1KB), $pct)
