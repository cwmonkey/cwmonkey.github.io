# source -> destination mappings
$files = @{
  "E:\wamp64\www\cwmonkey.github.io\_site\greasemonkey\video-skip-time\video-skip-time.user.js" = "F:\Tools\tamperdav\dav\Tampermonkey\sync\de79f065-5670-4754-870c-21082a49826e.user.js"
  "E:\wamp64\www\cwmonkey.github.io\_site\greasemonkey\yt-video-dark-mode\yt-video-dark-mode.user.js" = "F:\Tools\tamperdav\dav\Tampermonkey\sync\5df73b9c-682a-40b9-98eb-cdef87343126.user.js"
}

foreach ($mapping in $files.GetEnumerator()) {
  $source = $mapping.Key
  $destination = $mapping.Value

  $directory = Split-Path $source
  $filename = Split-Path $source -Leaf

  try {
    if (Test-Path $source -PathType Leaf) {
      Copy-Item -Path $source -Destination $destination -Force

      Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Copied:"
      Write-Host "    $source"
      Write-Host " -> $destination"
    }
  }
  catch {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Copy failed:"
    Write-Host "    $($_.Exception.Message)"
  }
}