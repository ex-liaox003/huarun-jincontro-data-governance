$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$fname = [string]([char]0x534E) + [char]0x6DA6 + [char]0x94F6 + [char]0x884C + '-' + [char]0x6570 + [char]0x636E + [char]0x5E94 + [char]0x7528 + [char]0x9700 + [char]0x6C42 + [char]0x6587 + [char]0x6863 + '.docx'
$dst = Join-Path $root $fname
$w = New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
try {
  $d = $w.Documents.Open($dst,$false,$false)
  $s1 = $d.InlineShapes.Item(1)
  try { $s1.LinkFormat.BreakLink(); Write-Output "BreakLink OK" }
  catch { Write-Output "BreakLink ERR: $($_.Exception.Message)" }
  $d.Close($false)   # discard
} finally { $w.Quit() }
