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

function formatCentsUsd(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  return `$${(safeCents / 100).toFixed(2)}`;
}

export function FounderAffiliates() {
  const [data, setData] = useState<AffiliateMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [activeCodeQuery, setActiveCodeQuery] = useState('');

  const loadCounts = useCallback(async (codeToQuery: string) => {
    setLoading(true);
    setError('');
    const trimmed = codeToQuery.trim().toLowerCase();
    const path = trimmed
      ? `/metrics/affiliates?code=${encodeURIComponent(trimmed)}`
      : '/metrics/affiliates';
    try {
      const result = await api.get<AffiliateMetricsPayload>(path);
      setData(result);
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

  useEffect(() => {
    void loadCounts(activeCodeQuery);
  }, [activeCodeQuery, loadCounts]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCodeQuery(codeFilter.trim().toLowerCase());
  };

  const handleClearFilter = () => {
    setCodeFilter('');
    setActiveCodeQuery('');
  };

  const rows: AffiliateCodeRow[] =
    data && data.items.length > 0
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
              onClick={() => void loadCounts(activeCodeQuery)}
              className="min-h-[48px] rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-2.5 text-base font-semibold text-[#F4F1EA] transition-colors hover:border-[#FFD21E]"
            >
              Refresh
            </button>
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border-2 border-[#FF6B6B] bg-[#12151A] p-6 text-xl font-semibold text-[#FF6B6B]"
          >
            {error}
          </div>
        ) : (
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
                className="block md:table-row-group divide-y divide-[#3A3F45] text-lg md:text-xl font-medium text-[#F4F1EA] tabular-nums"
              >
                {rows.map(row => (
                  <tr
                    role="row"
                    key={row.referral_code}
                    className="block md:table-row p-4 md:p-0 space-y-1.5 md:space-y-0 hover:bg-[#1A1E25]"
                  >
                    <th
                      role="rowheader"
                      scope="row"
                      className="flex items-center justify-between md:table-cell py-1 md:py-4 md:px-5 font-mono font-bold text-[#FFD21E] md:text-[#F4F1EA] before:content-['Referral_Code'] before:font-sans before:text-base before:font-semibold before:text-[#E2E0D8] md:before:content-none"
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
              Refunds are not recorded on these rows (revenue_allocations keeps
              its initial reserved status after a completed Square payment
              because refund webhooks do not update this table). Check Square
              for refunds before paying any creator.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export default FounderAffiliates;
