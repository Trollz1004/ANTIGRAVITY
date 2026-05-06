$body = @{model="cfo"; messages=@(@{role="user"; content="reply with one word: ok"}); max_tokens=10} | ConvertTo-Json -Compress
$headers = @{Authorization="Bearer $env:OPENROUTER_API_KEY"}
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:11435/v1/chat/completions' -Method Post -ContentType 'application/json' -Headers $headers -Body $body -ErrorAction SilentlyContinue
    $r | ConvertTo-Json -Compress
} catch {
    $_.Exception.Message
}