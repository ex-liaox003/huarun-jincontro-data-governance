# docx_build.html -> .docx via local Word COM; polish into a formal spec doc:
#  - heading styles -> Heiti black; header/footer; TOC field; core properties
# NOTE: keep this file ASCII-only (PowerShell 5.1 reads no-BOM ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root 'docx_build.html'
# Huarun Yinhang - Shuju Yingyong Xuqiu Wendang.docx
$fname = [string]([char]0x534E) + [char]0x6DA6 + [char]0x94F6 + [char]0x884C + '-' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863 + '.docx'
$dst  = Join-Path $root $fname
if (-not (Test-Path $src)) { throw "missing $src" }

# "Huarun Yinhang molkuai . Shuju Yingyong Xuqiu Wendang"
$TITLE = [string]([char]0x534E) + [char]0x6DA6 + [char]0x94F6 + [char]0x884C + [char]0x6A21 + [char]0x5757 + ' ' + [char]0x00B7 + ' ' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863
$HEI   = [string]([char]0x9ED1) + [char]0x4F53     # Heiti
$DI    = [string]([char]0x7B2C)                    # di
$YE    = [string]([char]0x9875)                    # ye
$GONG  = [string]([char]0x5171)                    # gong
$SUBJ  = [string]([char]0x9700) + [char]0x6C42 + [char]0x89C4 + [char]0x683C + [char]0x8BF4 + [char]0x660E + [char]0x4E66  # xq guige sming
$AUTH  = [string]([char]0x6218) + [char]0x7565 + [char]0x90E8                                      # zhanluebu

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($src, $false, $false)   # writable: we modify
  $wd = $doc

  # ---- 1) built-in heading styles -> Heiti / black / formal sizes + outline levels ----
  # Word 2007's HTML import strips outlineLvl from the mapped heading styles, so
  # without re-stamping them here the TOC field renders EMPTY and nav pane has no tree.
  # (TOC field is \o "2-4": heading styles must carry outline levels 2..4 -> wdOutlineLevel2..5)
  foreach ($pair in @( @( -2, 16, 2 ), @( -3, 14, 3 ), @( -4, 13, 4 ), @( -5, 12, 5 ) )) {   # wdStyleHeading2..5
    $st = $wd.Styles.Item($pair[0])
    $st.Font.NameFarEast = $HEI
    $st.Font.Name = $HEI
    $st.Font.Bold = $true
    $st.Font.Color = 0
    $st.Font.Size = $pair[1]
    $st.ParagraphFormat.OutlineLevel = $pair[2]
  }

  # ---- 2) header / footer ----
  $sec = $wd.Sections.Item(1)
  $hdr = $sec.Headers.Item(1).Range            # wdHeaderFooterPrimary
  $hdr.Text = $TITLE
  $hdr.Font.Size = 9
  $hdr.ParagraphFormat.Alignment = 1           # center

  # footer: di {PAGE} ye  gong {NUMPAGES} ye
  $ftrP = $sec.Footers.Item(1)
  $fr = $ftrP.Range
  $fr.Text = "$DI "
  $fr = $ftrP.Range; $fr.Collapse(0)
  $null = $wd.Fields.Add($fr, 33, '', $true)          # wdFieldPage
  $fr = $ftrP.Range; $fr.Collapse(0); $fr.Text = " $YE  $GONG "
  $fr = $ftrP.Range; $fr.Collapse(0)
  $null = $wd.Fields.Add($fr, 26, '', $true)     # wdFieldNumPages
  $fr = $ftrP.Range; $fr.Collapse(0); $fr.Text = " $YE"
  $ftrP.Range.ParagraphFormat.Alignment = 1
  $ftrP.Range.Font.Size = 9

  # ---- 2c) Normal style -> deliverable body text (match reference doc: justify, 10.5pt) ----
  try {
    $nm = $wd.Styles.Item(-1)   # wdStyleNormal
    $nm.ParagraphFormat.Alignment = 3          # wdAlignParagraphJustify
    $nm.Font.Size = 10.5
  } catch { Write-Output 'WARN: Normal style tweak skipped' }

  # ---- 2b) layout normalization -> standard deliverable Word page (ref: canGu doc) ----
  # page: A4, 2.54cm margins all round (1440 twips = 72pt), content width 15.92cm
  $ps = $doc.PageSetup
  $ps.TopMargin = 72; $ps.BottomMargin = 72; $ps.LeftMargin = 72; $ps.RightMargin = 72
  $ps.HeaderDistance = 40; $ps.FooterDistance = 45

  # force Print Layout view in the (hidden) window so HTML import paginates by page
  try { $word.ActiveWindow.View.Type = 1 } catch { Write-Output 'WARN: view type not settable' }

  # tables: inline (never floating), fit-to-window 100% (wdAutoFitWindow=2).
  # Wide structure tables (many columns) additionally drop to 9pt so they fit cleanly.
  $nTab = 0; $nDense = 0
  foreach ($tbl in $doc.Tables) {
    try { $tbl.Rows.WrapAroundText = $false } catch {}
    try {
      $tbl.AutoFitBehavior(2)
      $tbl.PreferredWidthType = 2      # wdPreferredWidthPercent
      $tbl.PreferredWidth = 100
      if ($tbl.Columns.Count -gt 7) { $tbl.Range.Font.Size = 9; $nDense++ }
      $nTab++
    } catch { Write-Output ('WARN: table fit skipped: ' + $_.Exception.Message) }
  }
  Write-Output "TABLES_FITTED|$nTab|dense=$nDense"

  # screenshots: fit to content width (page 21cm - 2x2.54cm margins = 15.92cm = ~451pt)
  $nImg = 0
  foreach ($sh in $doc.InlineShapes) {
    try {
      $sh.LockAspectRatio = -1         # msoTrue: shrink height proportionally
      if ($sh.Width -gt 440) { $sh.Width = 440 }
      $nImg++
    } catch { }
  }
  Write-Output "IMAGES_RESIZED|$nImg"

  # ---- 3) TOC field at placeholder ----
  $rng = $wd.Content
  $found = $rng.Find.Execute('__TOC_PLACEHOLDER__')
  $toc = $null
  if ($found) {
    $rng.Text = ''
    $toc = $wd.TablesOfContents.Add($rng, $true, 2, 4, $false)
    $toc.Update()
  } else {
    Write-Output 'WARN: TOC placeholder not found'
  }

  # ---- 4) core properties (by name; numeric WdBuiltInProperty indexes are unreliable) ----
  try {
    $props = $doc.BuiltInDocumentProperties
    $props.Item('Title').Value = $TITLE
    $props.Item('Subject').Value = $SUBJ
    $props.Item('Author').Value = $AUTH
  } catch { Write-Output ('WARN: doc properties skipped: ' + $_.Exception.Message) }

  # ---- 5) repaginate, refresh TOC/fields, save ----
  # Fields inside header/footer are NOT covered by doc.Fields: update the footer/header
  # Range Fields explicitly, otherwise PAGE/NUMPAGES keep the stale pagination cached
  # at HTML-import time (e.g. "of 7" vs the real 100+ pages).
  $null = $wd.Repaginate
  $sec.Footers.Item(1).Range.Fields.Update() | Out-Null
  $sec.Headers.Item(1).Range.Fields.Update() | Out-Null
  if ($toc) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $null = $wd.Repaginate
  $sec.Footers.Item(1).Range.Fields.Update() | Out-Null
  if ($toc) { $toc.Update() }

  if (Test-Path $dst) { Remove-Item $dst -Force }
  $doc.SaveAs($dst, 12)   # 12 = wdFormatXMLDocument (.docx)
  $nTables = $doc.Tables.Count
  $nPages  = $doc.ComputeStatistics(2)  # wdStatisticPages
  $doc.Close($false)
  Write-Output "DOCX_SAVED|$dst|tables=$nTables|pages=$nPages"
} finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}

# ---- 6) embed linked pictures at ORIGINAL resolution (package-level) ----
# Word 2007 HTML import stores <img> as external file:/// links when built from
# a file on disk. The VML shape pins display size (e.g. 465pt), so what a
# reader sees when zooming depends on the linked binary: link -> breaks delivery
# (doc sent alone loses all screenshots). Fix: for every External image
# relationship, copy the source PNG into word\media\<name from URI> and rewrite
# the relationship to that internal target. Display geometry stays as Word
# computed it; the embedded bytes are the full 2888px screenshots -> zoom sharp.
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Decode-FileUri($u) {
  # Target URI may contain non-ASCII (Chinese) path segments percent-encoded as UTF-8
  $p = $u -replace '^file:///', ''
  $p = [uri]::UnescapeDataString($p)
  $p = $p -replace '/', '\'
  if ($p -match '^[A-Za-z]:') { return $p }
  return '\\' + $p   # UNC
}
function Get-MediaSlot($name) {
  # bank01..bank09 -> image1..image9 (2.1); bank_led01..09 -> image10..image18 (2.2)
  $m = [regex]::Match($name, '^bank(?:_led)?(\d+)\.png$')
  if (-not $m.Success) { return $null }
  $n = [int]$m.Groups[1].Value
  if ($name -like 'bank_led*') { return $n + 9 } else { return $n }
}
try {
  $zip = [System.IO.Compression.ZipFile]::Open($dst, 'Update')
  try {
    $reEntry = $zip.GetEntry('word/_rels/document.xml.rels')
    $sr = New-Object System.IO.StreamReader($reEntry.Open(), [System.Text.Encoding]::UTF8)
    $relsXml = $sr.ReadToEnd(); $sr.Close()
    $mc = [regex]::Matches($relsXml, '<Relationship\b[^>]*/>')
    $rewrites = @(); $added = 0; $missing = @()
    foreach ($m in $mc) {
      $tag = $m.Value
      if ($tag -notmatch 'TargetMode="External"') { continue }
      if ($tag -notmatch 'relationships/image') { continue }
      $tgt = [regex]::Match($tag, 'Target="([^"]+)"').Groups[1].Value
      $srcPath = Decode-FileUri $tgt
      if (-not (Test-Path -LiteralPath $srcPath)) { $missing += $srcPath; continue }
      $srcName = [System.IO.Path]::GetFileName($srcPath)
      # deterministic media name keyed to the display slot, so the later
      # high-res swap step finds the same entry regardless of rel ordering
      $slot = Get-MediaSlot $srcName
      $mediaPath = 'word/media/image' + $slot + '.png'
      if ($null -ne $zip.GetEntry($mediaPath)) { $zip.GetEntry($mediaPath).Delete() }
      $entry = $zip.CreateEntry($mediaPath, [System.IO.Compression.CompressionLevel]::NoCompression)
      $bytes = [System.IO.File]::ReadAllBytes($srcPath)
      $st = $entry.Open(); $st.Write($bytes, 0, $bytes.Length); $st.Close()
      $added++
      $oldTag = $tag
      # Target is relative to word/ (rels live in word/_rels/) -> must include media/ prefix
      $newTag = $tag -replace [regex]::Escape('Target="' + $tgt + '"'), ('Target="media/image' + $slot + '.png"')
      $newTag = $newTag -replace '\s*TargetMode="External"', ''
      $rewrites += ,@($oldTag, $newTag)
    }
    if ($rewrites.Count -gt 0) {
      $newXml = $relsXml
      foreach ($rw in $rewrites) { $newXml = $newXml.Replace($rw[0], $rw[1]) }
      $reEntry.Delete()
      $ne = $zip.CreateEntry('word/_rels/document.xml.rels', [System.IO.Compression.CompressionLevel]::Optimal)
      $bw = New-Object System.IO.StreamWriter($ne.Open(), (New-Object System.Text.UTF8Encoding($false)))
      $bw.Write($newXml); $bw.Close()
    }
    # ensure PNG content type exists (Word's [Content_Types].xml may lack it)
    $ctEntry = $zip.GetEntry('[Content_Types].xml')
    $sr2 = New-Object System.IO.StreamReader($ctEntry.Open(), [System.Text.Encoding]::UTF8)
    $ctXml = $sr2.ReadToEnd(); $sr2.Close()
    if ($ctXml -notmatch 'Extension="png"') {
      $ctNew = $ctXml -replace '</Types>', '<Default Extension="png" ContentType="image/png"/></Types>'
      $ctEntry.Delete()
      $ce = $zip.CreateEntry('[Content_Types].xml', [System.IO.Compression.CompressionLevel]::Optimal)
      $bw2 = New-Object System.IO.StreamWriter($ce.Open(), (New-Object System.Text.UTF8Encoding($false)))
      $bw2.Write($ctNew); $bw2.Close()
      Write-Output 'CT_PNG_ADDED'
    }
    Write-Output "EMBEDDED|$added|$($rewrites.Count)"
    if ($missing.Count) { Write-Output ('WARN missing sources: ' + ($missing -join '; ')) }
    if ($added -ne 18) { throw "embed incomplete: $added/18 images embedded" }
  } finally { $zip.Dispose() }
} catch {
  throw "Embed step failed: $($_.Exception.Message)"
}

# ---- 7) swap downscaled media for full-resolution screenshots ----
# Word 2007 HTML import re-rasters every <img> to its displayed size (~620px),
# so zooming in shows blur. The display shape is fixed in document.xml; only the
# binary changes. Replace word/media/imageN.png in-place with the original shots:
#   N=1..9   -> shots\bankNN.png      (2.1 fixed reports, document order)
#   N=10..18 -> shots\bank_ledNN.png  (2.2 ledgers)
# Each swap is guarded by an aspect-ratio check against the downscaled copy.
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Get-PngWH($path) {
  $b = [System.IO.File]::ReadAllBytes($path)
  if ($b.Length -lt 24 -or $b[1] -ne 0x50) { return $null }  # not PNG
  $w = ($b[16] * 16777216) + ($b[17] * 65536) + ($b[18] * 256) + $b[19]
  $h = ($b[20] * 16777216) + ($b[21] * 65536) + ($b[22] * 256) + $b[23]
  return @($w, $h)
}
$shotsDir = Join-Path $root 'shots'
$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Update')
try {
  $swapped = 0; $skipped = @()
  foreach ($e in @($zip.Entries)) {
    $m = [regex]::Match($e.FullName, '^word/media/image(\d+)\.png$')
    if (-not $m.Success) { continue }
    $num = [int]$m.Groups[1].Value
    if ($num -lt 1 -or $num -gt 18) { continue }
    if ($num -le 9) { $srcName = 'bank' + $num.ToString('00') + '.png' }
    else            { $srcName = 'bank_led' + ($num - 9).ToString('00') + '.png' }
    $srcPath = Join-Path $shotsDir $srcName
    if (-not (Test-Path $srcPath)) { $skipped += "$srcName missing"; continue }
    # ratio guard: extract downscaled entry, compare aspect to source
    $tmp = [System.IO.Path]::GetTempFileName()
    $in = $e.Open(); $out = [System.IO.File]::Create($tmp)
    $in.CopyTo($out); $out.Close(); $in.Close()
    $d = Get-PngWH $tmp; Remove-Item $tmp -Force
    $s = Get-PngWH $srcPath
    if (-not $d -or -not $s) { $skipped += "$srcName not-png"; continue }
    $rd = [double]$d[0] / $d[1]; $rs = [double]$s[0] / $s[1]
    if ([Math]::Abs($rd - $rs) / $rs -gt 0.02) { $skipped += ('{0} ratio {1:N3} vs {2:N3}' -f $srcName, $rs, $rd); continue }
    # replace entry bytes
    $name = $e.FullName
    $e.Delete()
    $ne = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
    $bytes = [System.IO.File]::ReadAllBytes($srcPath)
    $st = $ne.Open(); $st.Write($bytes, 0, $bytes.Length); $st.Close()
    $swapped++
  }
  $zip.Dispose()
  if ($skipped.Count) { Write-Output ('WARN media swap skipped: ' + ($skipped -join '; ')) }
  Write-Output "MEDIA_SWAPPED|$swapped"
} catch {
  $zip.Dispose()
  Write-Output ('WARN media swap failed: ' + $_.Exception.Message)
}

# ---- 7) reopen to verify the swapped package still opens cleanly ----
try {
  $word2 = New-Object -ComObject Word.Application
  $word2.Visible = $false
  $word2.DisplayAlerts = 0
  try {
    $doc2 = $word2.Documents.Open($dst, $false, $true)   # read-only
    $pages2 = $doc2.ComputeStatistics(2)
    $shapes2 = $doc2.InlineShapes.Count
    $doc2.Close($false)
    Write-Output "VERIFY_OK|pages=$pages2|inlineShapes=$shapes2"
  } finally {
    $word2.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word2) | Out-Null
  }
} catch {
  Write-Output ('WARN verify open failed: ' + $_.Exception.Message)
}
