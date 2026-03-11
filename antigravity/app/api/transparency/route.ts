import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASESCAN_API = 'https://api.basescan.org/api';

const WALLETS = [
  {
    address: '0x9855B75061D4c841791382998f0CE8B2BCC965A4',
    label: 'GospelDonation.sol',
    role: 'Revenue Router',
    percentage: 'Immutable 60/30/10',
    walletType: 'Verified Smart Contract',
  },
  {
    address: '0x8d3dEADbE2b4B857A43331D459270B5eedC7084e',
    label: "Children's Medical Care",
    role: 'Charity Fund',
    percentage: '60%',
    walletType: 'Safe Wallet',
  },
  {
    address: '0xe0a42f83900af719019eBeD3D9473BE8E8f2920b',
    label: 'Mission Infrastructure + AI Ops',
    role: 'Infrastructure Treasury',
    percentage: '30%',
    walletType: 'Safe Wallet',
  },
  {
    address: '0x7c3E283119718395Ef5EfBAC4F52738C2018daA7',
    label: 'Founder Operations',
    role: 'Founder Ops',
    percentage: '10%',
    walletType: 'Founder Wallet',
  },
] as const;

async function fetchBalanceWei(address: string): Promise<string> {
  try {
    const response = await fetch(
      `${BASESCAN_API}?module=account&action=balance&address=${address}&tag=latest`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return '0';
    }

    const payload = (await response.json()) as { status?: string; result?: string };
    return payload.status === '1' && typeof payload.result === 'string' ? payload.result : '0';
  } catch {
    return '0';
  }
}

async function fetchTransactionCount(address: string): Promise<number> {
  try {
    const response = await fetch(
      `${BASESCAN_API}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      return 0;
    }

    const payload = (await response.json()) as { result?: string };
    return payload.result ? parseInt(payload.result, 16) : 0;
  } catch {
    return 0;
  }
}

function weiToEth(wei: string): string {
  try {
    const weiPerEth = BigInt('1000000000000000000');
    const weiValue = BigInt(wei);
    const ethWhole = weiValue / weiPerEth;
    const ethFraction = weiValue % weiPerEth;
    return `${ethWhole}.${ethFraction.toString().padStart(18, '0').slice(0, 6)}`;
  } catch {
    return '0.000000';
  }
}

export async function GET() {
  try {
    const [balances, contractTxCount] = await Promise.all([
      Promise.all(WALLETS.map((wallet) => fetchBalanceWei(wallet.address))),
      fetchTransactionCount(WALLETS[0].address),
    ]);

    const wallets = WALLETS.map((wallet, index) => ({
      ...wallet,
      balanceEth: weiToEth(balances[index] ?? '0'),
      basescanUrl: `https://basescan.org/address/${wallet.address}`,
    }));

    return NextResponse.json({
      wallets,
      contractTxCount,
      contractVerified: true,
      network: 'Base Mainnet (Chain ID: 8453)',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch transparency data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
