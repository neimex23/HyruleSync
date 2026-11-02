$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$images = @()
foreach ($size in @(16, 24, 32, 48, 64, 128, 256)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = 'AntiAlias'
    $g.ScaleTransform($size / 256.0, $size / 256.0)
    $g.Clear([System.Drawing.Color]::Transparent)
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#172a32'))
    $gold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#dec787'))
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#faf3db'))
    $shape = New-Object System.Drawing.Drawing2D.GraphicsPath
    $shape.AddArc(0, 0, 110, 110, 180, 90); $shape.AddArc(146, 0, 110, 110, 270, 90)
    $shape.AddArc(146, 146, 110, 110, 0, 90); $shape.AddArc(0, 146, 110, 110, 90, 90); $shape.CloseFigure()
    $g.FillPath($bg, $shape)
    $ring = New-Object System.Drawing.Pen($gold, 12)
    $g.DrawEllipse($ring, 50, 44, 156, 156)
    $g.FillPolygon($gold, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(128,49),[System.Drawing.PointF]::new(149,128),[System.Drawing.PointF]::new(128,195),[System.Drawing.PointF]::new(107,128)))
    $g.FillPolygon($white, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(128,49),[System.Drawing.PointF]::new(149,128),[System.Drawing.PointF]::new(128,116)))
    $g.FillEllipse($bg, 141, 139, 88, 88)
    $check = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#9bd9c1'), 13)
    $check.StartCap = 'Round'; $check.EndCap = 'Round'; $check.LineJoin = 'Round'
    $g.DrawLines($check, [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(161,183),[System.Drawing.PointF]::new(177,199),[System.Drawing.PointF]::new(208,165)))
    $stream = New-Object System.IO.MemoryStream
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += ,@{ size = $size; bytes = $stream.ToArray() }
    if ($size -eq 64) { [IO.File]::WriteAllBytes((Join-Path $projectRoot 'web/public/app-icon.png'), $stream.ToArray()) }
    $stream.Dispose(); $check.Dispose(); $ring.Dispose(); $shape.Dispose(); $white.Dispose(); $gold.Dispose(); $bg.Dispose(); $g.Dispose(); $bitmap.Dispose()
}
$file = [IO.File]::Create((Join-Path $projectRoot 'assets/hyrulesync.ico'))
$writer = New-Object IO.BinaryWriter($file)
$writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$images.Count)
$offset = 6 + 16 * $images.Count
foreach ($item in $images) {
    $dimension = if ($item.size -eq 256) { 0 } else { $item.size }
    $writer.Write([byte]$dimension); $writer.Write([byte]$dimension); $writer.Write([UInt16]0)
    $writer.Write([UInt16]1); $writer.Write([UInt16]32)
    $writer.Write([UInt32]$item.bytes.Length); $writer.Write([UInt32]$offset)
    $offset += $item.bytes.Length
}
foreach ($item in $images) { $writer.Write([byte[]]$item.bytes) }
$writer.Dispose(); $file.Dispose()
