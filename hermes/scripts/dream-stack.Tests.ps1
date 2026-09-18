# Pester 3.x spec for scripts\dream-stack.ps1 (the self-healing stack supervisor).
# Run:  Invoke-Pester -Path .\scripts\dream-stack.Tests.ps1
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'dream-stack.ps1') -NoMain

Describe 'Get-StackServices' {
  $services = Get-StackServices
  It 'lists every service of the full stack on this node plus the Sabertooth probes' {
    $names = $services | ForEach-Object { $_.Name }
    foreach ($n in 'jarvis', 'hermes-dashboard', 'ollama', 'live-npc-lab', 'dreamops', 'crosslisting', 'omniroute', 'sentry') {
      ($names -contains $n) | Should Be $true
    }
  }
  It 'marks local services managed (with a start command) and remote ones probe-only' {
    ($services | Where-Object Name -eq 'jarvis').Managed | Should Be $true
    ($services | Where-Object Name -eq 'jarvis').Start | Should Not BeNullOrEmpty
    ($services | Where-Object Name -eq 'sentry').Managed | Should Be $false
    ($services | Where-Object Name -eq 'omniroute').Url | Should Match '^http://192\.168\.0\.8:20128/'
  }
  It 'never carries a personal user path in the table' {
    ($services | ConvertTo-Json -Depth 4) | Should Not Match 'Users\\joshi|Users/joshi'
  }
  It 'supervises Crosslisting with an identity-checked probe and a real start command' {
    $cl = $services | Where-Object Name -eq 'crosslisting'
    $cl.Managed | Should Be $true
    $cl.Url | Should Match ':3000'
    $cl.Identity | Should Not BeNullOrEmpty
    $cl.Start.File | Should Match 'cmd'
    ($cl.Start.Args -join ' ') | Should Match 'crosslisting|index\.ts'
    ($cl.Start.Args -join ' ') | Should Match 'tsx'
  }
}

Describe 'Test-ServiceHealth' {
  $jarvis = Get-StackServices | Where-Object Name -eq 'jarvis'
  $omni = Get-StackServices | Where-Object Name -eq 'omniroute'
  It 'reports UP only when the identity check passes' {
    (Test-ServiceHealth -Service $jarvis -Fetch { @{ Status = 200; Body = '{"service":"airi-dashboard"}' } }).State | Should Be 'UP'
    (Test-ServiceHealth -Service $jarvis -Fetch { @{ Status = 200; Body = '{"service":"something-else"}' } }).State | Should Be 'WRONG SERVICE'
  }
  It 'reports DOWN with the reason when the probe throws' {
    $r = Test-ServiceHealth -Service $jarvis -Fetch { throw 'connection refused' }
    $r.State | Should Be 'DOWN'
    $r.Detail | Should Match 'refused'
  }
  It 'treats an OmniRoute auth challenge as reachable' {
    (Test-ServiceHealth -Service $omni -Fetch { @{ Status = 401; Body = '{"error":"unauthorized"}' } }).State | Should Be 'UP'
  }
}

Describe 'Get-HealAction' {
  It 'does nothing for a healthy service' {
    Get-HealAction -State 'UP' -Managed $true -RecentRestarts 0 | Should Be 'none'
  }
  It 'starts a managed service that is down while under the restart cap' {
    Get-HealAction -State 'DOWN' -Managed $true -RecentRestarts 2 | Should Be 'start'
  }
  It 'only reports a remote service that is down' {
    Get-HealAction -State 'DOWN' -Managed $false -RecentRestarts 0 | Should Be 'report'
  }
  It 'backs off after five restarts in the window instead of flapping' {
    Get-HealAction -State 'DOWN' -Managed $true -RecentRestarts 5 | Should Be 'backoff'
  }
  It 'restarts a service that answers as the wrong process' {
    Get-HealAction -State 'WRONG SERVICE' -Managed $true -RecentRestarts 0 | Should Be 'start'
  }
}
