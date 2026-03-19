import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Headset, Send, ShieldAlert, Ticket } from 'lucide-react';

import { ApiError, api } from '../../lib/api';

type ChatRole = 'user' | 'assistant';

interface SupportChatMessage {
  role: ChatRole;
  content: string;
}

interface SupportTicketResponse {
  id: string;
  status: string;
  category: string;
  subject: string;
  customer_email: string;
  customer_message: string;
  bot_response: string | null;
  escalation_reason: string | null;
  transcript: SupportChatMessage[];
  created_at: string;
  updated_at: string;
}

interface SupportChatResponse {
  reply: string;
  escalated: boolean;
  category: string;
  preset_key: string | null;
  ticket: SupportTicketResponse | null;
}

const initialAssistantMessage: SupportChatMessage = {
  role: 'assistant',
  content:
    'Support is live. Ask about receipts, verification, privacy controls, or app issues. If this needs a human, I will open a ticket and notify the operator.',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function Support() {
  const [messages, setMessages] = useState<SupportChatMessage[]>([initialAssistantMessage]);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [operatorTickets, setOperatorTickets] = useState<SupportTicketResponse[]>([]);
  const [operatorViewEnabled, setOperatorViewEnabled] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTickets() {
    setError(null);
    try {
      const mine = await api.get<SupportTicketResponse[]>('/support/tickets');
      setTickets(mine);
    } catch (err) {
      console.error(err);
      setError('Unable to load your support ticket history right now.');
    }

    try {
      const queue = await api.get<SupportTicketResponse[]>('/support/operator/tickets');
      setOperatorTickets(queue);
      setOperatorViewEnabled(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setOperatorViewEnabled(false);
        setOperatorTickets([]);
        return;
      }
      console.error(err);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  const conversationTranscript = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || loading) return;

    const userMessage: SupportChatMessage = { role: 'user', content: trimmed };
    const transcript = [...conversationTranscript];
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const response = await api.post<SupportChatResponse>('/support/chat', {
        message: trimmed,
        transcript,
      });
      const assistantMessage: SupportChatMessage = { role: 'assistant', content: response.reply };
      setMessages((current) => [...current, assistantMessage]);
      if (response.ticket) {
        setTickets((current) => [response.ticket as SupportTicketResponse, ...current]);
        if (operatorViewEnabled) {
          setOperatorTickets((current) => [response.ticket as SupportTicketResponse, ...current]);
        }
      }
      setNotice(
        response.escalated
          ? 'A human support ticket was opened and queued for review.'
          : `Support answered using the ${response.category.replace('_', ' ')} lane.`,
      );
    } catch (err) {
      console.error(err);
      setError('Support chat could not respond right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualEscalation() {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content ?? draft.trim();
    const message = lastUserMessage.trim();
    if (!message || loading) return;

    setLoading(true);
    setNotice(null);
    setError(null);
    try {
      const ticket = await api.post<SupportTicketResponse>('/support/tickets', {
        message,
        transcript: conversationTranscript,
      });
      setTickets((current) => [ticket, ...current]);
      if (operatorViewEnabled) {
        setOperatorTickets((current) => [ticket, ...current]);
      }
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'A human support ticket has been opened and queued for review.' },
      ]);
      setNotice('Manual escalation submitted.');
    } catch (err) {
      console.error(err);
      setError('Manual escalation could not be created.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 text-slate-100 sm:px-8">
      <div className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Support Center</span>
            <h2 className="mt-3 text-3xl font-semibold text-white">Preset answers first. Human escalation when it counts.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              The support bot handles receipts, verification, privacy controls, and routine product questions. Anything sensitive,
              billing-related, or uncertain can be escalated into a ticket with the transcript attached.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <Headset size={16} className="text-cyan-300" />
              Live support workflow
            </div>
            <div className="mt-1 text-slate-500">Bot answer {'->'} ticket escalation {'->'} operator review</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-900 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl border border-emerald-900 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-slate-800 bg-slate-950/85 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.45)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Chat with support</h3>
              <p className="mt-1 text-sm text-slate-500">The bot stays narrow on receipts, privacy, verification, and app issues.</p>
            </div>
            <button
              type="button"
              onClick={handleManualEscalation}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-amber-700/60 bg-amber-950/50 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldAlert size={16} />
              Escalate to human
            </button>
          </div>

          <div className="mt-4 flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[86%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'self-start border border-slate-800 bg-slate-900/85 text-slate-200'
                    : 'self-end bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white shadow-lg shadow-cyan-950/30'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="self-start rounded-3xl border border-slate-800 bg-slate-900/85 px-4 py-3 text-sm text-slate-400">
                Support is thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder="Ask about receipts, subscriptions, verification, privacy, or report a product issue."
              className="w-full rounded-[24px] border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Safety, billing disputes, and access issues auto-escalate.
              </div>
              <button
                type="submit"
                disabled={loading || draft.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </form>
        </article>

        <div className="grid gap-6">
          <aside className="rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-5">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-cyan-300" />
              <h3 className="text-lg font-semibold text-white">My tickets</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">Every escalation keeps the customer message and bot reply together.</p>

            <div className="mt-4 space-y-3">
              {tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                  No support tickets yet.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{ticket.subject}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                          {ticket.category.replace('_', ' ')}
                        </div>
                      </div>
                      <span className="rounded-full border border-amber-700/70 bg-amber-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{ticket.customer_message}</div>
                    {ticket.bot_response && (
                      <div className="mt-3 rounded-2xl border border-slate-800 bg-black/20 px-3 py-3 text-sm text-slate-400">
                        Bot: {ticket.bot_response}
                      </div>
                    )}
                    <div className="mt-3 text-xs text-slate-500">Opened {formatDate(ticket.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {operatorViewEnabled && (
            <aside className="rounded-[28px] border border-cyan-900/50 bg-cyan-950/20 p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-cyan-300" />
                <h3 className="text-lg font-semibold text-white">Operator queue</h3>
              </div>
              <p className="mt-1 text-sm text-slate-400">Visible only to configured operator accounts.</p>

              <div className="mt-4 space-y-3">
                {operatorTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="text-sm font-medium text-white">{ticket.customer_email}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-300">
                      {ticket.category.replace('_', ' ')} · {ticket.escalation_reason || 'manual_review'}
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{ticket.customer_message}</div>
                    {ticket.bot_response && (
                      <div className="mt-3 rounded-2xl border border-slate-800 bg-black/20 px-3 py-3 text-sm text-slate-400">
                        Bot: {ticket.bot_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
