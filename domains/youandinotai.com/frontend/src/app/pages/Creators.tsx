import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildCreatorLink, drawQr, toShortName } from '../../lib/creatorLink';

const DISCLOSURE_LINE = 'I earn money when you sign up through this link.';

/**
 * Public page: anyone types a short name and gets their link and QR code.
 * Uses the same generator as public/affiliate-links.html (see lib/creatorLink).
 * Says only what the code does today: members who sign up on the browser that
 * opened the link are counted for the creator, and the founder sends payouts.
 */
export function Creators() {
  const [raw, setRaw] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const url = buildCreatorLink(raw);
  const name = toShortName(raw);
  const showError = !url && raw.trim().length > 0;

  useEffect(() => {
    document.title = 'Creators: earn 50% | YouAndINotAI';
  }, []);

  useEffect(() => {
    setCopied(false);
    if (url && canvasRef.current) drawQr(canvasRef.current, url);
  }, [url]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand('copy');
      } catch {
        // Nothing more to try; the link is shown on the page to copy by hand.
      }
      document.body.removeChild(t);
    }
    setCopied(true);
  }

  function downloadQr() {
    if (!url || !name || !canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `youandinotai-${name}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] px-4 py-6 text-[#F4F1EA] sm:py-8 md:px-8">
      <header className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between border-b border-[#3A3F45] pb-4">
        <Link to="/" className="flex items-center gap-3 text-left no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#12151A] font-display text-sm font-bold text-[#FFD21E]">
            Y&amp;I
          </span>
          <span className="block font-display text-base font-bold tracking-tight text-[#F4F1EA]">
            YouAndINotAI
          </span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-3xl font-bold leading-tight text-[#F4F1EA] sm:text-4xl">
          Creators: earn 50%
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-[#F4F1EA]">
          You earn half of what the members you bring pay, for as long as they
          pay.
        </p>

        <ul className="mt-6 list-disc space-y-3 pl-6 text-lg leading-relaxed text-[#E4E1DA]">
          <li>
            Type a short name below. You get one link and one QR code that are
            yours.
          </li>
          <li>
            A member is counted for you when they sign up on the same phone or
            computer where they opened your link.
          </li>
          <li>Payouts are sent by the founder.</li>
          <li>
            Say clearly in your posts that you earn from sign-ups. You can copy
            this line:
            <span className="mt-2 block rounded-lg border border-[#3A3F45] bg-[#12151A] px-4 py-3 text-[#F4F1EA]">
              {DISCLOSURE_LINE}
            </span>
          </li>
        </ul>

        <section
          aria-labelledby="creator-link-heading"
          className="mt-10 rounded-xl border border-[#3A3F45] bg-[#12151A] p-5 sm:p-8"
        >
          <h2
            id="creator-link-heading"
            className="font-display text-2xl font-bold text-[#F4F1EA]"
          >
            Your link and QR code
          </h2>
          <label
            htmlFor="creator-name"
            className="mt-5 block text-lg font-bold text-[#F4F1EA]"
          >
            Your name
          </label>
          <input
            id="creator-name"
            type="text"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            placeholder="for example maya-rose"
            aria-describedby="creator-name-hint"
            className="app-input mt-2 w-full text-xl"
          />
          <p id="creator-name-hint" className="mt-2 text-base text-[#C9CBCE]">
            Letters, numbers and dashes. 3 to 30 characters.
          </p>
          <p
            role="alert"
            className="mt-2 min-h-[1.5em] text-base font-bold text-[#FDA4AF]"
          >
            {showError ? 'Use 3 to 30 letters, numbers or dashes.' : ''}
          </p>

          {url && (
            <div className="mt-4">
              <p className="text-base text-[#C9CBCE]">Your link:</p>
              <a
                href={url}
                className="mt-1 block break-all text-xl font-bold text-[#FFD21E]"
              >
                {url}
              </a>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="ds-btn-signal min-h-[52px]"
                >
                  Copy link
                </button>
                <span
                  role="status"
                  className="text-lg font-bold text-[#86EFAC]"
                >
                  {copied ? 'Copied' : ''}
                </span>
              </div>
              <canvas
                ref={canvasRef}
                width={240}
                height={240}
                role="img"
                aria-label="QR code for your link"
                className="mt-5 block h-[240px] w-[240px] rounded-xl bg-white"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="mt-2 text-base text-[#C9CBCE]">
                People can scan this code with a phone camera.
              </p>
              <button
                type="button"
                onClick={downloadQr}
                className="ds-btn-ghost mt-4 min-h-[52px]"
              >
                Download QR as PNG
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Creators;
