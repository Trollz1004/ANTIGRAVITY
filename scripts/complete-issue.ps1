$json = @{status="done"} | ConvertTo-Json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$webRequest = [System.Net.WebRequest]::Create("http://127.0.0.1:3100/api/issues/YOU-19")
$webRequest.Method = "PATCH"
$webRequest.ContentType = "application/json"
$webRequest.ContentLength = $bytes.Length
$stream = $webRequest.GetRequestStream()
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()
$response = $webRequest.GetResponse()
$responseStream = $response.GetResponseStream()
$reader = New-Object System.IO.StreamReader($responseStream)
$result = $reader.ReadToEnd()
$reader.Close()
$response.Close()
Write-Output $result