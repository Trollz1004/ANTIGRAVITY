$comment = "Health check done: Paperclip UP (3100), OmniRoute UP (20128), Hermes DOWN (8642/11435). Watchdog script exists but Hermes offline. Not restarting without Josh go."
$json = @{body=$comment} | ConvertTo-Json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$webRequest = [System.Net.WebRequest]::Create("http://127.0.0.1:3100/api/issues/YOU-19/comments")
$webRequest.Method = "POST"
$webRequest.ContentType = "application/json"
$webRequest.ContentLength = $bytes.Length
$stream = $webRequest.GetRequestStream()
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()
try {
    $response = $webRequest.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $result = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()
    Write-Output $result
} catch {
    $errorResponse = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($errorResponse.GetErrorStream())
    $errorBody = $reader.ReadToEnd()
    $reader.Close()
    Write-Output "Error: $errorBody"
}