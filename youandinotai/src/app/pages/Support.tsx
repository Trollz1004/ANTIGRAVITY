import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bug,
  CreditCard,
  ExternalLink,
  Headset,
  Lock,
  ReceiptText,
  Send,
  ShieldAlert,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApiError, api } from '../../lib/api';

type ChatRole = 'user' | 'assistant';
type SupportActionKind = 'message' | 'ticket' | 'link';

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

interface SupportLaneAction {
  label: string;
  hint: string;
  kind: SupportActionKind;
  value?: string;
  href?: string;
}

interface SupportLane {
  id: string;
  title: string;
  description: string;
  guidance: string;
  defaultMessage: string;
  icon: LucideIcon;
  accentClass: string;
  actions: SupportLaneAction[];
}

const SUPPORT_LANES: SupportLane[] = [
  {
    id: 'receipts',
    title: 'Receipt & Payment',
    description: 'Square receipts, Bot-Shield charges, and checkout follow-up.',
    guidance: 'Use this lane when the payment went through but you need the receipt or payment record checked.',
    defaultMessage: 'I need help finding my Square receipt or payment confirmation.',
    icon: ReceiptText,
    accentClass: 'from-cyan-400/20 via-blue-500/15 to-transparent border-cyan-400/30',
    actions: [
      {
        label: 'Receipt still missing',
        hint: 'Escalate a billing review ticket.',
        kind: 'ticket',
        value: 'I still cannot find my Square receipt. Please open a billing review ticket.',
      },
      {
        label: 'Founder billing question',
        hint: 'Ask about a subscription or founder charge.',
        kind: 'message',
        value: 'I need help with a Founding Member or other founder-plan charge.',
      },
    ],
  },
  {
    id: 'verification',
    title: 'Verified Badge',
    description: 'Liveness, badge status, and access after Bot-Shield.',
    guidance: 'Use this lane if you finished verification but the badge or access state looks wrong.',
    defaultMessage: 'I completed Bot-Shield but my verified badge did not update.',
    icon: BadgeCheck,
    accentClass: 'from-emerald-400/20 via-cyan-500/15 to-transparent border-emerald-400/30',
    actions: [
      {
        label: 'Badge still missing',
        hint: 'Open a verification review ticket.',
        kind: 'ticket',
        value: 'I completed the liveness check and payment, but my verified badge still has not updated.',
      },
      {
        label: 'Retry help',
        hint: 'Ask for the next step before escalating.',
        kind: 'message',
        value: 'The verification flow failed and I need help understanding the next step.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Export, deletion requests, and location tracking controls.',
    guidance: 'Use this lane for privacy settings or when a privacy request did not process correctly.',
    defaultMessage: 'I need help with privacy controls, data export, or account deletion.',
    icon: Lock,
    accentClass: 'from-fuchsia-400/20 via-violet-500/15 to-transparent border-fuchsia-400/30',
    actions: [
      {
        label: 'Open Data & Privacy',
        hint: 'Go to the control panel directly.',
        kind: 'link',
        href: '/app/privacy',
      },
      {
        label: 'Privacy request failed',
        hint: 'Escalate to a human review ticket.',
        kind: 'ticket',
        value: 'My privacy or data request did not process correctly and I need human review.',
      },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    description: 'Founding Member status, recurring billing, and charge corrections.',
    guidance: 'Use this lane when the active subscription state looks wrong or a renewal needs review.',
    defaultMessage: 'I need help with my subscription, founding member status, or billing.',
    icon: CreditCard,
    accentClass: 'from-amber-400/20 via-orange-500/15 to-transparent border-amber-400/30',
    actions: [
      {
        label: 'Open billing ticket',
        hint: 'Human review for a recurring charge or renewal issue.',
        kind: 'ticket',
        value: 'I need human help with a subscription, renewal, or billing issue.',
      },
      {
        label: 'Charged twice',
        hint: 'Tell the bot exactly what happened.',
        kind: 'message',
        value: 'I believe I was charged twice or my subscription status looks wrong.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Bug or App Issue',
    description: 'Messages, boards, video, profile, or anything broken in the app.',
    guidance: 'Use this lane when a feature is failing and you want the transcript attached to the ticket.',
    defaultMessage: 'The app is not working correctly and I need technical help.',
    icon: Bug,
    accentClass: 'from-rose-400/20 via-pink-500/15 to-transparent border-rose-400/30',
    actions: [
      {
        label: 'Open technical ticket',
        hint: 'Escalate with the current transcript.',
        kind: 'ticket',
        value: 'The app has a bug and I need technical support with a human review.',
      },
      {
        label: 'Describe the failure',
        hint: 'Start a guided bug report in chat.',
        kind: 'message',
        value: 'Messages, video, or another feature is not working correctly and I want to report the exact failure.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Report a User',
    description: 'Unsafe behavior, harassment, fraud, or anything that needs fast review.',
    guidance: 'Use this lane for safety issues. It should escalate quickly and keep the record together.',
    defaultMessage: 'I need to report unsafe behavior, harassment, fraud, or another safety issue.',
    icon: ShieldAlert,
    accentClass: 'from-red-500/20 via-rose-500/15 to-transparent border-red-400/35',
    actions: [
      {
        label: 'Open safety review',
        hint: 'Send this straight to the human queue.',
        kind: 'ticket',
        value: 'I need a human safety review for harassment, fraud, or another unsafe situation.',
      },
      {
        label: 'Safety guidance',
        hint: 'Ask for the immediate next step.',
        kind: 'message',
        value: 'I need immediate guidance for a safety problem or user report.',
      },
    ],
  },
];

const initialAssistantMessage: SupportChatMessage = {
  role: 'assistant',
  content:
    'Choose a support lane below to get a fast preset answer. You can still type a custom question, and anything sensitive or uncertain can be escalated to a human.',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function actionButtonClasses(kind: SupportActionKind): string {
  if (kind === 'ticket') {
    return 'inline-flex items-center gap-2 rounded-full border border-amber-700/60 bg-amber-950/50 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-500';
  }

  if (kind === 'link') {
    return 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white';
  }

  return 'inline-flex items-center gap-2 rounded-full border border-cyan-700/50 bg-cyan-950/40 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 hover:text-white';
}

export function Support() {
  const [messages, setMessages] = useState<SupportChatMessage[]>([initialAssistantMessage]);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [operatorTickets, setOperatorTickets] = useState<SupportTicketResponse[]>([]);
  const [operatorViewEnabled, setOperatorViewEnabled] = useState(false);
  const [selectedLaneId, setSelectedLaneId] = useState(SUPPORT_LANES[0].id);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const conversationTranscript = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim().length > 0)
        .map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  const selectedLane = useMemo(
    () => SUPPORT_LANES.find((lane) => lane.id === selectedLaneId) ?? SUPPORT_LANES[0],
    [selectedLaneId],
  );

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

  function prependTicket(ticket: SupportTicketResponse) {
    setTickets((current) => [ticket, ...current]);
    if (operatorViewEnabled) {
      setOperatorTickets((current) => [ticket, ...current]);
    }
  }

  async function submitSupportMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage: SupportChatMessage = { role: 'user', content: trimmed };
    const transcript = [...conversationTranscript];
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const response = await api.post<SupportChatResponse>('/support/chat', {
        message: trimmed,
        transcript,
      });

      setMessages((current) => [...current, { role: 'assistant', content: response.reply }]);
      if (response.ticket) {
        prependTicket(response.ticket as SupportTicketResponse);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDraft('');
    await submitSupportMessage(trimmed);
  }

  async function handleManualEscalation(messageOverride?: string) {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';
    const message = messageOverride?.trim() || lastUserMessage.trim() || draft.trim() || selectedLane.defaultMessage;
    if (!message || loading) return;

    const shouldAppendUser =
      !lastUserMessage || (messageOverride && lastUserMessage.trim().toLowerCase() !== message.trim().toLowerCase());

    if (shouldAppendUser) {
      setMessages((current) => [...current, { role: 'user', content: message }]);
    }

    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const ticket = await api.post<SupportTicketResponse>('/support/tickets', {
        message,
        transcript: conversationTranscript,
      });
      prependTicket(ticket);
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

  async function handleLaneSelect(lane: SupportLane) {
    setSelectedLaneId(lane.id);
    setDraft('');
    await submitSupportMessage(lane.defaultMessage);
  }

  async function handleLaneAction(action: SupportLaneAction) {
    if (action.kind === 'message' && action.value) {
      await submitSupportMessage(action.value);
      return;
    }

    if (action.kind === 'ticket' && action.value) {
      await handleManualEscalation(action.value);
    }
  }

  const SelectedLaneIcon = selectedLane.icon;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 text-slate-100 sm:px-8">
      <div className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Support Center</span>
            <h2 className="mt-3 text-3xl font-semibold text-white">Guided support first. Human review when it actually matters.</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Pick a lane like receipts, verification, privacy, or app issues. The support assistant stays narrow, gives preset answers,
              and escalates only when the request needs billing, safety, access, or human judgment.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <Headset size={16} className="text-cyan-300" />
              Live support workflow
            </div>
            <div className="mt-1 text-slate-500">Pick lane {'->'} preset answer {'->'} escalate only if needed</div>
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

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[28px] border border-slate-800 bg-slate-950/85 p-5 shadow-[0_20px_80px_rgba(2,6,23,0.45)]">
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Choose a support lane</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This works more like a live help desk than an open-ended chatbot. Pick the closest lane and let the system route it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleManualEscalation()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-amber-700/60 bg-amber-950/50 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldAlert size={16} />
                Open human ticket
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {SUPPORT_LANES.map((lane) => {
                const Icon = lane.icon;
                const isSelected = lane.id === selectedLane.id;

                return (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => void handleLaneSelect(lane)}
                    disabled={loading}
                    className={`rounded-[24px] border bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] p-4 text-left transition duration-200 hover:border-cyan-400/60 hover:shadow-[0_18px_50px_rgba(8,145,178,0.18)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected ? 'border-cyan-400/60 shadow-[0_18px_50px_rgba(8,145,178,0.18)]' : 'border-slate-800'
                    }`}
                  >
                    <div className={`rounded-2xl border bg-gradient-to-br p-3 ${lane.accentClass}`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="mt-4 text-base font-semibold text-white">{lane.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{lane.description}</p>
                    <div className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-300">
                      {isSelected ? 'Selected lane' : 'Ask support'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.10),_transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.85))] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <SelectedLaneIcon size={18} className="text-cyan-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Selected lane</div>
                  <h4 className="mt-2 text-lg font-semibold text-white">{selectedLane.title}</h4>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{selectedLane.guidance}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-400">
                The operator only gets pulled in when billing, safety, access, or uncertainty crosses the line.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedLane.actions.map((action) =>
                action.kind === 'link' && action.href ? (
                  <Link key={action.label} to={action.href} className={actionButtonClasses(action.kind)}>
                    <ExternalLink size={15} />
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleLaneAction(action)}
                    className={`${actionButtonClasses(action.kind)} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {action.kind === 'ticket' ? <Ticket size={15} /> : <Send size={15} />}
                    {action.label}
                  </button>
                ),
              )}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {selectedLane.actions.map((action) => action.hint).join('  •  ')}
            </div>
          </div>

          <div className="mt-5 flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 ${
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
              rows={3}
              placeholder="Need something outside the guided lanes? Type it here."
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
                Send custom message
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
