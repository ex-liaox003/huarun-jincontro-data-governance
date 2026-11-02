# bud (yuSuanZhi TianBao) req doc: docx_build_bud.html -> .docx via local Word COM
# style chain identical to gen_bank_req_docx.ps1 (heading->Heiti, header/footer, TOC field, doc props)
# NOTE: keep this file ASCII-only (PowerShell 5.1 reads no-BOM ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $root 'docx_build_bud.html'

# "YuSuanZhi TianBao - ShuJu YingYong XuQiu WenDang.docx"
$fname = [string]([char]0x9884) + [char]0x7B97 + [char]0x503C + [char]0x586B + [char]0x62A5 + '-' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863 + '.docx'
$dst  = Join-Path $root $fname
if (-not (Test-Path $src)) { throw "missing $src" }

# "YuSuanZhi TianBao moKuai . ShuJu YingYong XuQiu WenDang"
$TITLE = [string]([char]0x9884) + [char]0x7B97 + [char]0x503C + [char]0x586B + [char]0x62A5 + ' ' + [char]0x00B7 + ' ' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863
$HEI   = [string]([char]0x9ED1) + [char]0x4F53     # Heiti
$DI    = [string]([char]0x7B2C)                    # di
$YE    = [string]([char]0x9875)                    # ye
$GONG  = [string]([char]0x5171)                    # gong
$SUBJ  = [string]([char]0x9700) + [char]0x6C42 + [char]0x89C4 + [char]0x683C + [char]0x8BF4 + [char]0x660E + [char]0x4E66  # xuQiu GuiGe ShuoMingShu
$AUTH  = [string]([char]0x6218) + [char]0x7565 + [char]0x90E8                                      # ZhanLueBu

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($src, $false, $false)
  $wd = $doc

  # ---- 1) heading styles -> Heiti/black + outline levels (TOC \o 2-4 needs them) ----
  foreach ($pair in @( @( -2, 16, 2 ), @( -3, 14, 3 ), @( -4, 13, 4 ) )) {   # wdStyleHeading2..4
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
  $hdr = $sec.Headers.Item(1).Range
  $hdr.Text = $TITLE
  $hdr.Font.Size = 9
  $hdr.ParagraphFormat.Alignment = 1

  $ftrP = $sec.Footers.Item(1)
  $fr = $ftrP.Range
  $fr.Text = "$DI "
  $fr = $ftrP.Range; $fr.Collapse(0)
  $null = $wd.Fields.Add($fr, 33, '', $true)          # wdFieldPage
  $fr = $ftrP.Range; $fr.Collapse(0); $fr.Text = " $YE  $GONG "
  $fr = $ftrP.Range; $fr.Collapse(0)
  $null = $wd.Fields.Add($fr, 26, '', $true)          # wdFieldNumPages
  $fr = $ftrP.Range; $fr.Collapse(0); $fr.Text = " $YE"
  $ftrP.Range.ParagraphFormat.Alignment = 1
  $ftrP.Range.Font.Size = 9

  # ---- 2c) Normal style -> 10.5pt justify ----
  try {
    $nm = $wd.Styles.Item(-1)
    $nm.ParagraphFormat.Alignment = 3
    $nm.Font.Size = 10.5
  } catch { Write-Output 'WARN: Normal style tweak skipped' }

  # ---- 2b) page layout: A4 margins 72pt ----
  $ps = $doc.PageSetup
  $ps.TopMargin = 72; $ps.BottomMargin = 72; $ps.LeftMargin = 72; $ps.RightMargin = 72
  $ps.HeaderDistance = 40; $ps.FooterDistance = 45
  try { $word.ActiveWindow.View.Type = 1 } catch { }

  # tables: inline, fit-to-window 100%
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

  # ---- 5) repaginate, refresh fields, save ----
  $null = $wd.Repaginate
  $sec.Footers.Item(1).Range.Fields.Update() | Out-Null
  $sec.Headers.Item(1).Range.Fields.Update() | Out-Null
  if ($toc) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $null = $wd.Repaginate
  $sec.Footers.Item(1).Range.Fields.Update() | Out-Null
  if ($toc) { $toc.Update() }

  if (Test-Path $dst) { Remove-Item $dst -Force }
  $doc.SaveAs($dst, 12)   # wdFormatXMLDocument
  $nTables = $doc.Tables.Count
  $nPages  = $doc.ComputeStatistics(2)
  $doc.Close($false)
  Write-Output "DOCX_SAVED|$dst|tables=$nTables|pages=$nPages"
} finally {
  $word.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}

# ---- 6) verify opens cleanly (no images in this doc, so no media embedding step) ----
try {
  $word2 = New-Object -ComObject Word.Application
  $word2.Visible = $false
  $word2.DisplayAlerts = 0
  try {
    $doc2 = $word2.Documents.Open($dst, $false, $true)
    $pages2 = $doc2.ComputeStatistics(2)
    $doc2.Close($false)
    Write-Output "VERIFY_OK|pages=$pages2"
  } finally {
    $word2.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word2) | Out-Null
  }
} catch {
  Write-Output ('WARN verify open failed: ' + $_.Exception.Message)
}
