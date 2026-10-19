# docx_build_ins.html -> .docx via local Word COM; same pipeline as gen_bank_req_docx.ps1.
#  - heading styles -> Heiti black; header/footer; TOC field; core properties
#  - embed screenshots at ORIGINAL resolution (package-level)
# NOTE: keep this file ASCII-only (PowerShell 5.1 reads no-BOM ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root 'docx_build_ins.html'
# Huarun Baoxian - Shuju Yingyong Xuqiu Wendang.docx
$fname = [string]([char]0x534E) + [char]0x6DA6 + [char]0x4FDD + [char]0x9669 + '-' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863 + '.docx'
$dst  = Join-Path $root $fname
if (-not (Test-Path $src)) { throw "missing $src" }

# "Huarun Baoxian molkuai . Shuju Yingyong Xuqiu Wendang"
$TITLE = [string]([char]0x534E) + [char]0x6DA6 + [char]0x4FDD + [char]0x9669 + [char]0x6A21 + [char]0x5757 + ' ' + [char]0x00B7 + ' ' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863
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

  # ---- 2c) Normal style -> deliverable body text ----
  try {
    $nm = $wd.Styles.Item(-1)   # wdStyleNormal
    $nm.ParagraphFormat.Alignment = 3          # wdAlignParagraphJustify
    $nm.Font.Size = 10.5
  } catch { Write-Output 'WARN: Normal style tweak skipped' }

  # ---- 2b) layout normalization -> A4, 72pt margins ----
  $ps = $doc.PageSetup
  $ps.TopMargin = 72; $ps.BottomMargin = 72; $ps.LeftMargin = 72; $ps.RightMargin = 72
  $ps.HeaderDistance = 40; $ps.FooterDistance = 45
  try { $word.ActiveWindow.View.Type = 1 } catch { Write-Output 'WARN: view type not settable' }

  # tables: inline, fit-to-window 100%; dense tables drop to 9pt
  $nTab = 0; $nDense = 0
  foreach ($tbl in $doc.Tables) {
    try { $tbl.Rows.WrapAroundText = $false } catch {}
    try {
      $tbl.AutoFitBehavior(2)
      $tbl.PreferredWidthType = 2
      $tbl.PreferredWidth = 100
      if ($tbl.Columns.Count -gt 7) { $tbl.Range.Font.Size = 9; $nDense++ }
      $nTab++
    } catch { Write-Output ('WARN: table fit skipped: ' + $_.Exception.Message) }
  }
  Write-Output "TABLES_FITTED|$nTab|dense=$nDense"

  # screenshots: fit to content width
  $nImg = 0
  foreach ($sh in $doc.InlineShapes) {
    try {
      $sh.LockAspectRatio = -1
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

  # ---- 4) core properties ----
  try {
    $props = $doc.BuiltInDocumentProperties
    $props.Item('Title').Value = $TITLE
    $props.Item('Subject').Value = $SUBJ
    $props.Item('Author').Value = $AUTH
  } catch { Write-Output ('WARN: doc properties skipped: ' + $_.Exception.Message) }

  # ---- 5) repaginate, refresh TOC/fields, save ----
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

# ---- 6) embed screenshots at ORIGINAL resolution (package-level) ----
# Word 2007 HTML import either links external images or re-rasters them to display
# size (~620px). Replace every word/media/imageN.png with the full-resolution
# source from shots_ins\: image1..3 = ins_fix01..03 (2.1), image4..6 = ins_led01..03 (2.2).
# Rewrite any still-external relationships to internal media targets.
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Decode-FileUri($u) {
  $p = $u -replace '^file:///', ''
  $p = [uri]::UnescapeDataString($p)
  $p = $p -replace '/', '\'
  if ($p -match '^[A-Za-z]:') { return $p }
  return '\\' + $p
}
$slotMap = @{ 1='ins_fix01.png'; 2='ins_fix02.png'; 3='ins_fix03.png'; 4='ins_led01.png'; 5='ins_led02.png'; 6='ins_led03.png' }
$shotsDir = Join-Path $root 'shots_ins'
try {
  $zip = [System.IO.Compression.ZipFile]::Open($dst, 'Update')
  try {
    # 6a) rewrite External image rels -> internal media slots (numbered by document order)
    $reEntry = $zip.GetEntry('word/_rels/document.xml.rels')
    $sr = New-Object System.IO.StreamReader($reEntry.Open(), [System.Text.Encoding]::UTF8)
    $relsXml = $sr.ReadToEnd(); $sr.Close()
    $mc = [regex]::Matches($relsXml, '<Relationship\b[^>]*/>')
    $ext = @($mc | Where-Object { $_.Value -match 'TargetMode="External"' -and $_.Value -match 'relationships/image' })
    $rewrites = @(); $n = 0
    foreach ($m in $ext) {
      $tag = $m.Value
      $tgt = [regex]::Match($tag, 'Target="([^"]+)"').Groups[1].Value
      $srcName = [System.IO.Path]::GetFileName((Decode-FileUri $tgt))
      # slot keyed by source name: ins_fixNN -> image N ; ins_ledNN -> image N+3
      $mm = [regex]::Match($srcName, '^ins_(fix|led)(\d{2})\.png$')
      if (-not $mm.Success) { Write-Output ('WARN: unmapped image rel: ' + $srcName); continue }
      $idx = [int]$mm.Groups[2].Value
      if ($mm.Groups[1].Value -eq 'led') { $idx = $idx + 3 }
      $newTag = $tag -replace [regex]::Escape('Target="' + $tgt + '"'), ('Target="media/image' + $idx + '.png"')
      $newTag = $newTag -replace '\s*TargetMode="External"', ''
      $rewrites += ,@($tag, $newTag)
      $n++
    }
    if ($rewrites.Count -gt 0) {
      $newXml = $relsXml
      foreach ($rw in $rewrites) { $newXml = $newXml.Replace($rw[0], $rw[1]) }
      $reEntry.Delete()
      $ne = $zip.CreateEntry('word/_rels/document.xml.rels', [System.IO.Compression.CompressionLevel]::Optimal)
      $bw = New-Object System.IO.StreamWriter($ne.Open(), (New-Object System.Text.UTF8Encoding($false)))
      $bw.Write($newXml); $bw.Close()
    }
    Write-Output "RELS_REWRITTEN|$n"

    # 6b) swap/insert word/media/imageN.png with full-resolution originals
    $swapped = 0; $missing = @()
    foreach ($num in 1..6) {
      $srcName = $slotMap[$num]
      $srcPath = Join-Path $shotsDir $srcName
      if (-not (Test-Path $srcPath)) { $missing += $srcName; continue }
      $mediaPath = 'word/media/image' + $num + '.png'
      $e = $zip.GetEntry($mediaPath)
      if ($null -ne $e) { $e.Delete() }
      $entry = $zip.CreateEntry($mediaPath, [System.IO.Compression.CompressionLevel]::Optimal)
      $bytes = [System.IO.File]::ReadAllBytes($srcPath)
      $st = $entry.Open(); $st.Write($bytes, 0, $bytes.Length); $st.Close()
      $swapped++
    }
    # ensure PNG content type exists
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
    Write-Output "MEDIA_EMBEDDED|$swapped"
    if ($missing.Count) { throw ('missing shot sources: ' + ($missing -join '; ')) }
    if ($swapped -ne 6) { throw "embed incomplete: $swapped/6 images embedded" }
  } finally { $zip.Dispose() }
} catch {
  throw "Embed step failed: $($_.Exception.Message)"
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
