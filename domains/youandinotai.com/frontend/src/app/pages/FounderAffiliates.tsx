import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

export interface AffiliateCodeRow {
  referral_code: string;
  signups_count: number;
  verified_count: number;
  payments_count: number;
  gross_cents: number;
  owed_cents: number;
}

export interface AffiliateMetricsPayload {
  generated_at: string;
  items: AffiliateCodeRow[];
  totals: {
    codes_count: number;
    signups_count: number;
    verified_count: number;
    payments_count: number;
    gross_cents: number;
    owed_cents: number;
  };
}

export interface SignupSourceRow {
  signup_source: string;
  accounts_last_30_days: number;
  verified_last_30_days: number;
  paid_last_30_days: number;
  accounts_all_time: number;
  verified_all_time: number;
  paid_all_time: number;
}

export interface SignupSourceMetricsPayload {
  generated_at: string;
  items: SignupSourceRow[];
  totals: {
    sources_count: number;
    accounts_last_30_days: number;
    verified_last_30_days: number;
    paid_last_30_days: number;
    accounts_all_time: number;
    verified_all_time: number;
    paid_all_time: number;
  };
}

function formatCentsUsd(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  return `$${(safeCents / 100).toFixed(2)}`;
}

const TAGGED_LINK_BASE = 'https://youandinotai.com/';

export function cleanTagField(raw: string): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

export function buildTaggedLink(
  source: string,
  medium: string,
  campaign: string
): string {
  const cleanSource = cleanTagField(source);
  const cleanMedium = cleanTagField(medium);
  const cleanCampaign = cleanTagField(campaign);
  const params: string[] = [];
  if (cleanSource) {
    params.push(`utm_source=${cleanSource}`);
  }
  if (cleanMedium) {
    params.push(`utm_medium=${cleanMedium}`);
  }
  if (cleanCampaign) {
    params.push(`utm_campaign=${cleanCampaign}`);
  }
  return params.length > 0
    ? `${TAGGED_LINK_BASE}?${params.join('&')}`
    : TAGGED_LINK_BASE;
}

export function formatSignupSourceLabel(rawSource: string): string {
  const trimmed = (rawSource || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'not recorded') {
    return 'not recorded';
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'direct') {
    return 'Typed the address or no source';
  }
  if (lower.startsWith('ref:')) {
    const slug = trimmed.slice(4).trim();
    return slug ? `Partner link: ${slug}` : 'not recorded';
  }
  if (lower.startsWith('utm:')) {
    const campaign = trimmed
      .slice(4)
      .split('/')
      .map(part => part.trim())
      .filter(Boolean)
      .join(' / ');
    return campaign ? `Campaign: ${campaign}` : 'not recorded';
  }
  if (lower.startsWith('site:')) {
    const host = trimmed.slice(5).trim();
    return host ? `From ${host}` : 'not recorded';
  }
  return trimmed;
}

export function FounderAffiliates() {
  const [data, setData] = useState<AffiliateMetricsPayload | null>(null);
  const [sourceData, setSourceData] =
    useState<SignupSourceMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [activeCodeQuery, setActiveCodeQuery] = useState('');
  const [tagSource, setTagSource] = useState('');
  const [tagMedium, setTagMedium] = useState('');
  const [tagCampaign, setTagCampaign] = useState('');
  const [tagLinkCopied, setTagLinkCopied] = useState(false);

  const builtTaggedLink = buildTaggedLink(tagSource, tagMedium, tagCampaign);

  const handleTagSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSource(cleanTagField(e.target.value));
    setTagLinkCopied(false);
  };

  const handleTagMediumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagMedium(cleanTagField(e.target.value));
    setTagLinkCopied(false);
  };

  const handleTagCampaignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagCampaign(cleanTagField(e.target.value));
    setTagLinkCopied(false);
  };

  const handleCopyTaggedLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(builtTaggedLink);
      }
    } catch {
      // Clipboard may be blocked in restricted browser contexts.
    }
    setTagLinkCopied(true);
  };

  const loadCounts = useCallback(async (codeToQuery: string) => {
    setLoading(true);
    setError('');
    const trimmed = codeToQuery.trim().toLowerCase();
    const path = trimmed
      ? `/metrics/affiliates?code=${encodeURIComponent(trimmed)}`
      : '/metrics/affiliates';
    try {
      const result = await api.get<AffiliateMetricsPayload>(path);
      setData(result ?? null);
    } catch (err: any) {
      const status = err?.status;
      if (status === 403 || status === 401) {
        setError(
          'Founder or admin access is required to view referral counts.'
        );
      } else {
        setError(err?.message || 'Unable to load referral counts.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const result = await api.get<SignupSourceMetricsPayload>(
        '/metrics/signup-sources'
      );
      if (result && Array.isArray(result.items)) {
        setSourceData(result);
      } else {
        setSourceData(null);
      }
    } catch {
      setSourceData(null);
    }
  }, []);

  useEffect(() => {
    void loadCounts(activeCodeQuery);
  }, [activeCodeQuery, loadCounts]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCodeQuery(codeFilter.trim().toLowerCase());
  };

  const handleClearFilter = () => {
    setCodeFilter('');
    setActiveCodeQuery('');
  };

  const handleRefresh = () => {
    void loadCounts(activeCodeQuery);
    void loadSources();
  };

  const rows: AffiliateCodeRow[] =
    data && Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : [
          {
            referral_code: activeCodeQuery || '—',
            signups_count: 0,
            verified_count: 0,
            payments_count: 0,
            gross_cents: 0,
            owed_cents: 0,
          },
        ];

  const totals = data?.totals ?? {
    codes_count: 0,
    signups_count: 0,
    verified_count: 0,
    payments_count: 0,
    gross_cents: 0,
    owed_cents: 0,
  };

  const sourceRows: SignupSourceRow[] =
    sourceData && Array.isArray(sourceData.items) ? sourceData.items : [];

  const sourceTotals = sourceData?.totals ?? {
    sources_count: sourceRows.length,
    accounts_last_30_days: 0,
    verified_last_30_days: 0,
    paid_last_30_days: 0,
    accounts_all_time: 0,
    verified_all_time: 0,
    paid_all_time: 0,
  };

  return (
    <div className="bg-[#0A0B0D] text-[#F4F1EA] px-4 pt-5 pb-28 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl space-y-5 md:space-y-8">
        <header className="space-y-2 md:space-y-3 border-b border-[#3A3F45] pb-4 md:pb-6">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-[#FFD21E]">
            Founder Read-Only Ledger
          </p>
          <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight text-[#F4F1EA]">
            Referral Sign-Ups and Completed Payments
          </h1>
          <p className="text-base md:text-lg text-[#E2E0D8] max-w-3xl leading-snug md:leading-relaxed">
            Read-only counts joined from member accounts and collected customer
            Square payment records. Amount owed is half of collected gross
            receipts before manual refund checks.
          </p>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-wrap items-end gap-3 md:gap-4 rounded-xl border border-[#3A3F45] bg-[#12151A] p-4 md:p-6"
        >
          <div className="flex-1 min-w-[220px]">
            <label
              htmlFor="affiliate-code-filter"
              className="block text-base font-semibold text-[#F4F1EA] mb-1.5 md:mb-2"
            >
              Check referral code
            </label>
            <input
              id="affiliate-code-filter"
              type="text"
              value={codeFilter}
              onChange={e => setCodeFilter(e.target.value)}
              maxLength={64}
              placeholder="Enter code (e.g. creator-name)"
              className="w-full min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-lg text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
            />
          </div>
          <div className="flex flex-wrap gap-2.5 md:gap-3">
            <button
              type="submit"
              className="min-h-[48px] rounded-lg bg-[#FFD21E] px-5 py-2.5 text-base font-bold text-[#0A0B0D] transition-colors hover:bg-[#ffe055]"
            >
              Check Code
            </button>
            {activeCodeQuery && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-2.5 text-base font-semibold text-[#F4F1EA] transition-colors hover:border-[#FFD21E]"
              >
                Show All Codes
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className="min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-base font-semibold text-[#F4F1EA] transition-colors hover:border-[#FFD21E]"
            >
              Refresh
            </button>
          </div>
        </form>

        <section
          aria-label="Build a tagged link"
          className="rounded-xl border border-[#3A3F45] bg-[#12151A] p-4 md:p-6 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="font-display text-xl md:text-2xl font-bold text-[#F4F1EA]">
              Build a tagged link
            </h2>
            <p className="text-base text-[#E2E0D8]">
              Lowercase letters, digits, and dashes only. Visits from this link
              appear under Where members came from.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label
                htmlFor="tagged-link-source"
                className="block text-base font-semibold text-[#F4F1EA] mb-1.5"
              >
                Source
              </label>
              <input
                id="tagged-link-source"
                type="text"
                value={tagSource}
                onChange={handleTagSourceChange}
                maxLength={40}
                placeholder="e.g. youtube"
                className="w-full min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-lg text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
              />
            </div>

            <div>
              <label
                htmlFor="tagged-link-medium"
                className="block text-base font-semibold text-[#F4F1EA] mb-1.5"
              >
                Medium
              </label>
              <input
                id="tagged-link-medium"
                type="text"
                value={tagMedium}
                onChange={handleTagMediumChange}
                maxLength={40}
                placeholder="e.g. shorts"
                className="w-full min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-lg text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
              />
            </div>

            <div>
              <label
                htmlFor="tagged-link-campaign"
                className="block text-base font-semibold text-[#F4F1EA] mb-1.5"
              >
                Campaign
              </label>
              <input
                id="tagged-link-campaign"
                type="text"
                value={tagCampaign}
                onChange={handleTagCampaignChange}
                maxLength={40}
                placeholder="e.g. winter-date-night"
                className="w-full min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-lg text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 pt-1">
            <div
              data-testid="built-tagged-link"
              aria-label="Built tagged link"
              className="flex-1 min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 font-mono text-base md:text-lg text-[#FFD21E] break-all flex items-center"
            >
              {builtTaggedLink}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleCopyTaggedLink()}
                className="min-h-[48px] rounded-lg bg-[#FFD21E] px-5 py-2.5 text-base font-bold text-[#0A0B0D] transition-colors hover:bg-[#ffe055]"
              >
                Copy Link
              </button>
              {tagLinkCopied && (
                <span
                  role="status"
                  className="text-base font-bold text-[#FFD21E]"
                >
                  Copied
                </span>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border-2 border-[#FF6B6B] bg-[#12151A] p-6 text-xl font-semibold text-[#FF6B6B]"
          >
            {error}
          </div>
        ) : (
          <>
            <section
              aria-label="Where members came from"
              className="overflow-x-auto rounded-xl border border-[#3A3F45] bg-[#12151A]"
            >
              <div className="border-b border-[#3A3F45] px-5 py-4 space-y-1">
                <h2 className="font-display text-xl md:text-2xl font-bold text-[#F4F1EA]">
                  Where members came from
                </h2>
                <p className="text-base text-[#E2E0D8]">
                  Accounts, Bot-Shield passes, and paid accounts for the last 30
                  days and all time.
                </p>
              </div>

              {sourceRows.length === 0 ? (
                <p className="px-5 py-6 text-lg font-semibold text-[#F4F1EA]">
                  No sign-up sources are recorded yet.
                </p>
              ) : (
                <div className="w-full text-left">
                  <div className="hidden md:grid md:grid-cols-[4fr_0.88fr_1.54fr_0.58fr_0.88fr_1.54fr_0.58fr] border-b border-[#3A3F45] bg-[#1A1E25] text-base font-bold text-[#FFD21E]">
                    <div aria-hidden="true" className="py-2.5 px-5" />
                    <div className="col-span-3 py-2.5 px-2.5 pr-4 text-center whitespace-nowrap">
                      Last 30 days
                    </div>
                    <div className="col-span-3 py-2.5 pl-4 pr-5 text-center whitespace-nowrap md:border-l md:border-[#3A3F45]">
                      All time
                    </div>
                  </div>
                  <div className="hidden md:grid md:grid-cols-[4fr_0.88fr_1.54fr_0.58fr_0.88fr_1.54fr_0.58fr] border-b border-[#3A3F45] bg-[#1A1E25] text-base font-bold text-[#FFD21E]">
                    <div className="py-3.5 px-5 whitespace-nowrap">Source</div>
                    <div className="py-3.5 px-2.5 text-right whitespace-nowrap">
                      Accounts
                    </div>
                    <div className="py-3.5 px-2.5 text-right whitespace-nowrap">
                      Passed Bot-Shield
                    </div>
                    <div className="py-3.5 pl-2.5 pr-4 text-right whitespace-nowrap">
                      Paid
                    </div>
                    <div className="py-3.5 pl-4 pr-2.5 text-right whitespace-nowrap md:border-l md:border-[#3A3F45]">
                      Accounts
                    </div>
                    <div className="py-3.5 px-2.5 text-right whitespace-nowrap">
                      Passed Bot-Shield
                    </div>
                    <div className="py-3.5 pl-2.5 pr-5 text-right whitespace-nowrap">
                      Paid
                    </div>
                  </div>
                  <div
                    role="list"
                    className="divide-y divide-[#3A3F45] text-lg md:text-xl text-[#F4F1EA] tabular-nums"
                  >
                    {sourceRows.map(row => (
                      <div
                        key={row.signup_source}
                        role="listitem"
                        className="block md:grid md:grid-cols-[4fr_0.88fr_1.54fr_0.58fr_0.88fr_1.54fr_0.58fr] p-4 md:p-0 space-y-1.5 md:space-y-0"
                      >
                        <div className="flex items-center justify-between md:block py-1 md:py-4 md:px-5 font-semibold text-[#F4F1EA] break-normal hyphens-none">
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Source
                          </span>
                          <span className="break-normal hyphens-none">
                            {formatSignupSourceLabel(row.signup_source)}
                          </span>
                        </div>
                        <div
                          aria-label="Accounts, last 30 days"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right font-bold"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Accounts (30d)
                          </span>
                          <span>{row.accounts_last_30_days}</span>
                        </div>
                        <div
                          aria-label="Passed Bot-Shield, last 30 days"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right font-bold"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Passed Bot-Shield (30d)
                          </span>
                          <span>{row.verified_last_30_days}</span>
                        </div>
                        <div
                          aria-label="Paid, last 30 days"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:pl-2.5 md:pr-4 text-right font-bold"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Paid (30d)
                          </span>
                          <span>{row.paid_last_30_days}</span>
                        </div>
                        <div
                          aria-label="Accounts, all time"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:pl-4 md:pr-2.5 text-right font-bold md:border-l md:border-[#3A3F45]"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Accounts (All Time)
                          </span>
                          <span>{row.accounts_all_time}</span>
                        </div>
                        <div
                          aria-label="Passed Bot-Shield, all time"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right font-bold"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Passed Bot-Shield (All Time)
                          </span>
                          <span>{row.verified_all_time}</span>
                        </div>
                        <div
                          aria-label="Paid, all time"
                          className="flex items-center justify-between md:block py-1 md:py-4 md:pl-2.5 md:pr-5 text-right font-bold"
                        >
                          <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                            Paid (All Time)
                          </span>
                          <span>{row.paid_all_time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="block md:grid md:grid-cols-[4fr_0.88fr_1.54fr_0.58fr_0.88fr_1.54fr_0.58fr] border-t-2 border-[#3A3F45] bg-[#1A1E25] p-4 md:p-0 space-y-1.5 md:space-y-0 text-lg md:text-xl font-bold text-[#F4F1EA] tabular-nums">
                    <div className="flex items-center justify-between md:block py-1 md:py-4 md:px-5 break-normal hyphens-none">
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Summary
                      </span>
                      <span>
                        Total ({sourceTotals.sources_count}{' '}
                        {sourceTotals.sources_count === 1
                          ? 'source'
                          : 'sources'}
                        )
                      </span>
                    </div>
                    <div
                      aria-label="Total accounts, last 30 days"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Accounts (30d)
                      </span>
                      <span>{sourceTotals.accounts_last_30_days}</span>
                    </div>
                    <div
                      aria-label="Total passed Bot-Shield, last 30 days"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Passed Bot-Shield (30d)
                      </span>
                      <span>{sourceTotals.verified_last_30_days}</span>
                    </div>
                    <div
                      aria-label="Total paid, last 30 days"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:pl-2.5 md:pr-4 text-right"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Paid (30d)
                      </span>
                      <span>{sourceTotals.paid_last_30_days}</span>
                    </div>
                    <div
                      aria-label="Total accounts, all time"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:pl-4 md:pr-2.5 text-right md:border-l md:border-[#3A3F45]"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Accounts (All Time)
                      </span>
                      <span>{sourceTotals.accounts_all_time}</span>
                    </div>
                    <div
                      aria-label="Total passed Bot-Shield, all time"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:px-2.5 text-right"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Passed Bot-Shield (All Time)
                      </span>
                      <span>{sourceTotals.verified_all_time}</span>
                    </div>
                    <div
                      aria-label="Total paid, all time"
                      className="flex items-center justify-between md:block py-1 md:py-4 md:pl-2.5 md:pr-5 text-right"
                    >
                      <span className="text-base font-semibold text-[#E2E0D8] md:hidden">
                        Total Paid (All Time)
                      </span>
                      <span>{sourceTotals.paid_all_time}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section
              aria-label="Referral code counts"
              className="overflow-x-auto rounded-xl border border-[#3A3F45] bg-[#12151A]"
            >
              <p className="border-b border-[#3A3F45] px-5 py-3 text-base md:text-lg font-semibold text-[#FFD21E]">
                Counts only, nothing is paid from here.
              </p>
              <table
                role="table"
                className="w-full border-collapse text-left block md:table"
              >
                <thead
                  role="rowgroup"
                  className="sr-only md:not-sr-only md:table-header-group"
                >
                  <tr
                    role="row"
                    className="border-b border-[#3A3F45] bg-[#1A1E25] text-base md:text-lg font-bold text-[#FFD21E]"
                  >
                    <th role="columnheader" scope="col" className="py-4 px-5">
                      Referral Code
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="py-4 px-5 text-right"
                    >
                      Sign-Ups
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="py-4 px-5 text-right"
                    >
                      Passed $1 Check
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="py-4 px-5 text-right"
                    >
                      Completed Payments
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="py-4 px-5 text-right"
                    >
                      Gross Collected
                    </th>
                    <th
                      role="columnheader"
                      scope="col"
                      className="py-4 px-5 text-right"
                    >
                      Amount Owed (50%)
                    </th>
                  </tr>
                </thead>
                <tbody
                  role="rowgroup"
                  className="block md:table-row-group divide-y divide-[#3A3F45] text-lg md:text-xl text-[#F4F1EA] tabular-nums"
                >
                  {rows.map(row => (
                    <tr
                      key={row.referral_code}
                      role="row"
                      className="block md:table-row p-4 md:p-0 space-y-1.5 md:space-y-0"
                    >
                      <th
                        role="rowheader"
                        scope="row"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 font-mono font-bold text-[#F4F1EA] before:content-['Referral_Code'] before:font-sans before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {row.referral_code}
                      </th>
                      <td
                        role="cell"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Sign-Ups'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {row.signups_count}
                      </td>
                      <td
                        role="cell"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Passed_$1_Check'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {row.verified_count}
                      </td>
                      <td
                        role="cell"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Completed_Payments'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {row.payments_count}
                      </td>
                      <td
                        role="cell"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Gross_Collected'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {formatCentsUsd(row.gross_cents)}
                      </td>
                      <td
                        role="cell"
                        className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right font-bold text-[#FFD21E] before:content-['Amount_Owed_(50%)'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                      >
                        {formatCentsUsd(row.owed_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot
                  role="rowgroup"
                  className="block md:table-footer-group border-t-2 border-[#3A3F45] bg-[#1A1E25] text-lg md:text-xl font-bold text-[#F4F1EA] tabular-nums"
                >
                  <tr
                    role="row"
                    className="block md:table-row p-4 md:p-0 space-y-1.5 md:space-y-0"
                  >
                    <th
                      role="rowheader"
                      scope="row"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 before:content-['Summary'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      Total ({totals.codes_count}{' '}
                      {totals.codes_count === 1 ? 'code' : 'codes'})
                    </th>
                    <td
                      role="cell"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Total_Sign-Ups'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      {totals.signups_count}
                    </td>
                    <td
                      role="cell"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Total_Passed_$1_Check'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      {totals.verified_count}
                    </td>
                    <td
                      role="cell"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Total_Completed_Payments'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      {totals.payments_count}
                    </td>
                    <td
                      role="cell"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right before:content-['Total_Gross_Collected'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      {formatCentsUsd(totals.gross_cents)}
                    </td>
                    <td
                      role="cell"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 text-right text-[#FFD21E] before:content-['Total_Amount_Owed_(50%)'] before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
                    >
                      {formatCentsUsd(totals.owed_cents)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {loading && (
                <p className="border-t border-[#3A3F45] px-5 py-3 text-base text-[#E2E0D8]">
                  Loading current database counts…
                </p>
              )}
              <p className="border-t border-[#3A3F45] px-5 py-4 text-base md:text-lg text-[#E2E0D8]">
                Refunds are not recorded on these rows (revenue_allocations
                keeps its initial reserved status after a completed Square
                payment because refund webhooks do not update this table). Check
                Square for refunds before paying any creator.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default FounderAffiliates;
