# =============================================================================
#  KEY A FLAT-BLACK PLATE TO REAL ALPHA
# =============================================================================
#  Our creature plates are drawn on pure #000000. This turns that background
#  into true transparency and writes a web-sized PNG.
#
#  WHY FLOOD FILL AND NOT A LUMINANCE KEY:
#  A luminance key ("anything dark becomes transparent") would eat the subject.
#  These creatures are deliberately dark -- Cindermaw is charcoal armour with
#  ember cracks -- so a brightness threshold dissolves the body and leaves
#  floating glow. Instead we flood-fill inward from the image border: only
#  black that is CONNECTED to the edge is background. Dark pixels enclosed by
#  the creature are left completely alone.
#
#  Edges are then feathered one pixel so the cutout does not look stamped.
#
#  Usage:  ./keyalpha.ps1 -Source <in.png> -Dest <out.png> [-Width 900] [-Threshold 30]
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Dest,
  [int]$Width = 900,
  [int]$Threshold = 30
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Pixel work in C# -- a PowerShell loop over four million bytes takes minutes.
$cs = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;

public static class AlphaKey {
  public static Bitmap Key(Bitmap src, int threshold) {
    int w = src.Width, h = src.Height;
    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) { g.DrawImage(src, 0, 0, w, h); }

    BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int bytes = Math.Abs(d.Stride) * h;
    byte[] buf = new byte[bytes];
    Marshal.Copy(d.Scan0, buf, 0, bytes);

    bool[] bg = new bool[w * h];
    Stack<int> stack = new Stack<int>();

    // seed from every border pixel that is dark enough to be background
    for (int x = 0; x < w; x++) { Seed(buf, bg, stack, d.Stride, w, x, 0, threshold); Seed(buf, bg, stack, d.Stride, w, x, h - 1, threshold); }
    for (int y = 0; y < h; y++) { Seed(buf, bg, stack, d.Stride, w, 0, y, threshold); Seed(buf, bg, stack, d.Stride, w, w - 1, y, threshold); }

    while (stack.Count > 0) {
      int idx = stack.Pop();
      int x = idx % w, y = idx / w;
      if (x > 0)     Seed(buf, bg, stack, d.Stride, w, x - 1, y, threshold);
      if (x < w - 1) Seed(buf, bg, stack, d.Stride, w, x + 1, y, threshold);
      if (y > 0)     Seed(buf, bg, stack, d.Stride, w, x, y - 1, threshold);
      if (y < h - 1) Seed(buf, bg, stack, d.Stride, w, x, y + 1, threshold);
    }

    // alpha = 0 on background. Then feather: a kept pixel touching background
    // gets alpha scaled by its own brightness, so anti-aliased rims stay soft.
    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        int p = y * d.Stride + x * 4;
        int i = y * w + x;
        if (bg[i]) { buf[p + 3] = 0; continue; }
        bool edge = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (y > 0 && bg[i - w]) || (y < h - 1 && bg[i + w]);
        if (edge) {
          int lum = (buf[p + 2] * 30 + buf[p + 1] * 59 + buf[p] * 11) / 100;
          int a = lum * 255 / Math.Max(1, threshold * 2);
          buf[p + 3] = (byte)Math.Min(255, Math.Max(0, a));
        }
      }
    }

    Marshal.Copy(buf, 0, d.Scan0, bytes);
    bmp.UnlockBits(d);
    return bmp;
  }

  static void Seed(byte[] buf, bool[] bg, Stack<int> stack, int stride, int w, int x, int y, int threshold) {
    int i = y * w + x;
    if (bg[i]) return;
    int p = y * stride + x * 4;
    int lum = (buf[p + 2] * 30 + buf[p + 1] * 59 + buf[p] * 11) / 100;
    if (lum > threshold) return;
    bg[i] = true;
    stack.Push(i);
  }
}
"@
Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Drawing

$img = [System.Drawing.Image]::FromFile((Resolve-Path $Source))
$keyed = [AlphaKey]::Key($img, $Threshold)
$img.Dispose()

# downscale AFTER keying: full-resolution edges make a much cleaner alpha ramp
$h = [int]($keyed.Height * $Width / $keyed.Width)
$out = New-Object System.Drawing.Bitmap $Width, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($keyed, 0, 0, $Width, $h)
$g.Dispose(); $keyed.Dispose()

$out.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()

$f = Get-Item $Dest
Write-Host ("  keyed -> {0}  ({1} x {2}, {3} KB)" -f $f.Name, $Width, $h, [int]($f.Length / 1KB))
