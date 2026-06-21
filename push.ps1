$env_path = "C:\Users\joshl\OneDrive\JOSHUA's-DO-NOT-COMMIT-TO-GITHUB\JOSHUAS.ENV"
$pat = ""
Get-Content $env_path | ForEach-Object {
    if ($_ -match "^(GITHUB_PAT|GH_PAT)=(.*)$") {
        $pat = $Matches[2].Trim()
    }
}
$pat = $pat -replace '^"|"$|^''|''$', ''
cd C:\antigravity
git push "https://Trollz1004:${pat}@github.com/Trollz1004/ANTIGRAVITY.git" deploy/youandinotai-final:deploy/youandinotai-final
