$ErrorActionPreference='Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$fname = [string]([char]0x534E) + [char]0x6DA6 + [char]0x94F6 + [char]0x884C + '-' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863 + '.docx'
$dst = Join-Path $root $fname
$w = New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
try {
  $d = $w.Documents.Open($dst,$false,$false)
  $i=0
  foreach ($s in $d.InlineShapes) {
    $i++
    if ($i -gt 2) { break }
    Write-Output "shape${i}: type=$($s.Type)"
    try { $lf=$s.LinkFormat; Write-Output "  LinkFormat source=$($lf.SourceFullName) spwd=$($lf.SavePictureWithDocument)" }
    catch { Write-Output "  LinkFormat ERR: $($_.Exception.Message)" }
  }
  $d.Close($false)
} finally { $w.Quit() }
