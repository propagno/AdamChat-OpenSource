$hostname = "wsl"

# find ip of eth0
$ifconfig = (wsl -- ip -4 addr show eth0)
$ipPattern = "((\d+\.?){4})"
$ip = ([regex]"inet $ipPattern").Match($ifconfig).Groups[1].Value
if (-not $ip) {
    Write-Host "Não foi possível obter o IP do WSL2"
    exit
}
Write-Host "IP do WSL2: $ip"

$hostsPath = "$env:windir/system32/drivers/etc/hosts"

$hosts = (Get-Content -Path $hostsPath -Raw -ErrorAction Ignore)
if ($null -eq $hosts) {
    $hosts = ""
}
$hosts = $hosts.Trim()

# update or add wsl ip
$find = "$ipPattern\s+$hostname"
$entry = "$ip $hostname"

if ($hosts -match $find) {
    $hosts = $hosts -replace $find, $entry
    Write-Host "Entrada existente atualizada no arquivo hosts"
}
else {
    $hosts = "$hosts`n$entry".Trim()
    Write-Host "Nova entrada adicionada ao arquivo hosts"
}

try {
    $temp = "$hostsPath.new"
    New-Item -Path $temp -ItemType File -Force | Out-Null
    Set-Content -Path $temp $hosts

    Move-Item -Path $temp -Destination $hostsPath -Force
    Write-Host "Arquivo hosts atualizado com sucesso"
    Write-Host "Agora você pode acessar os serviços usando http://$hostname:3000 e http://$hostname:5000"
}
catch {
    Write-Error "Não foi possível atualizar o arquivo hosts. Execute este script como administrador."
} 