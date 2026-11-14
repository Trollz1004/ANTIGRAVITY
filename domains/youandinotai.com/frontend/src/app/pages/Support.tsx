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
import { motion, AnimatePresence } from 'framer-motion';

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
    guidance:
      'Use this lane when the payment went through but you need the receipt or payment record checked.',
    defaultMessage:
      'I need help finding my Square receipt or payment confirmation.',
    icon: ReceiptText,
    accentClass:
      'from-stone-400/20 via-stone-500/15 to-transparent border-stone-400/30 text-stone-400',
    actions: [
      {
        label: 'Receipt still missing',
        hint: 'Escalate a billing review ticket.',
        kind: 'ticket',
        value:
          'I still cannot find my Square receipt. Please open a billing review ticket.',
      },
      {
        label: 'Founder billing question',
        hint: 'Ask about a subscription or founder charge.',
        kind: 'message',
        value:
          'I need help with a Founding Member or other founder-plan charge.',
      },
    ],
  },
  {
    id: 'verification',
    title: 'Verified Badge',
    description: 'Human check, badge status, and access after Bot-Shield.',
    guidance:
      'Use this lane if you finished verification but the badge or access state looks wrong.',
    defaultMessage:
      'I completed Bot-Shield but my verified badge did not update.',
    icon: BadgeCheck,
    accentClass:
      'from-emerald-400/20 via-stone-500/15 to-transparent border-emerald-400/30 text-emerald-400',
    actions: [
      {
        label: 'Badge still missing',
        hint: 'Open a verification review ticket.',
        kind: 'ticket',
        value:
          'I completed the $1 human check and payment, but my verified badge still has not updated.',
      },
      {
        label: 'Retry help',
        hint: 'Ask for the next step before escalating.',
        kind: 'message',
        value:
          'The verification flow failed and I need help understanding the next step.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Export, deletion requests, and location tracking controls.',
    guidance:
      'Use this lane for privacy settings or when a privacy request did not process correctly.',
    defaultMessage:
      'I need help with privacy controls, data export, or account deletion.',
    icon: Lock,
    accentClass:
      'from-amber-400/20 via-violet-500/15 to-transparent border-amber-400/30 text-amber-400',
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
        value:
          'My privacy or data request did not process correctly and I need human review.',
      },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    description:
      'Founding Member status, recurring billing, and charge corrections.',
    guidance:
      'Use this lane when the active subscription state looks wrong or a renewal needs review.',
    defaultMessage:
      'I need help with my subscription, founding member status, or billing.',
    icon: CreditCard,
    accentClass:
      'from-amber-400/20 via-orange-500/15 to-transparent border-amber-400/30 text-amber-400',
    actions: [
      {
        label: 'Open billing ticket',
        hint: 'Human review for a recurring charge or renewal issue.',
        kind: 'ticket',
        value:
          'I need human help with a subscription, renewal, or billing issue.',
      },
      {
        label: 'Charged twice',
        hint: 'Tell the bot exactly what happened.',
        kind: 'message',
        value:
          'I believe I was charged twice or my subscription status looks wrong.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Bug or App Issue',
    description:
      'Messages, boards, video, profile, or anything broken in the app.',
    guidance:
      'Use this lane when a feature is failing and you want the transcript attached to the ticket.',
    defaultMessage:
      'The app is not working correctly and I need technical help.',
    icon: Bug,
    accentClass:
      'from-rose-400/20 via-amber-500/15 to-transparent border-rose-400/30 text-rose-400',
    actions: [
      {
        label: 'Open technical ticket',
        hint: 'Escalate with the current transcript.',
        kind: 'ticket',
        value:
          'The app has a bug and I need technical support with a human review.',
      },
      {
        label: 'Describe the failure',
        hint: 'Start a guided bug report in chat.',
        kind: 'message',
        value:
          'Messages, video, or another feature is not working correctly and I want to report the exact failure.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Report a User',
    description:
      'Unsafe behavior, harassment, fraud, or anything that needs fast review.',
    guidance:
      'Use this lane for safety issues. It should escalate quickly and keep the record together.',
    defaultMessage:
      'I need to report unsafe behavior, harassment, fraud, or another safety issue.',
    icon: ShieldAlert,
    accentClass:
      'from-red-500/20 via-rose-500/15 to-transparent border-red-400/35 text-red-500',
    actions: [
      {
        label: 'Open safety review',
        hint: 'Send this straight to the human queue.',
        kind: 'ticket',
        value:
          'I need a human safety review for harassment, fraud, or another unsafe situation.',
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

function actionButtonClasses(_kind: SupportActionKind): string {
  return 'flex items-center gap-2 rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[#F4F1EA] hover:border-[#F4F1EA] transition-colors';
}

export function Support() {
  const [messages, setMessages] = useState<SupportChatMessage[]>([
    initialAssistantMessage,
  ]);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [operatorTickets, setOperatorTickets] = useState<
    SupportTicketResponse[]
  >([]);
  const [operatorViewEnabled, setOperatorViewEnabled] = useState(false);
  const [selectedLaneId, setSelectedLaneId] = useState(SUPPORT_LANES[0].id);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const conversationTranscript = useMemo(
    () =>
      messages
        .filter(message => message.content.trim().length > 0)
        .map(message => ({ role: message.role, content: message.content })),
    [messages]
  );

  const selectedLane = useMemo(
    () =>
      SUPPORT_LANES.find(lane => lane.id === selectedLaneId) ??
      SUPPORT_LANES[0],
    [selectedLaneId]
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
      const queue = await api.get<SupportTicketResponse[]>(
        '/support/operator/tickets'
      );
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
    setTickets(current => [ticket, ...current]);
    if (operatorViewEnabled) {
      setOperatorTickets(current => [ticket, ...current]);
    }
  }

  async function submitSupportMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage: SupportChatMessage = { role: 'user', content: trimmed };
    const transcript = [...conversationTranscript];
    setMessages(current => [...current, userMessage]);
    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const response = await api.post<SupportChatResponse>('/support/chat', {
        message: trimmed,
        transcript,
      });
      setMessages(current => [
        ...current,
        { role: 'assistant', content: response.reply },
      ]);
      if (response.ticket) {
        prependTicket(response.ticket as SupportTicketResponse);
      }
      setNotice(
        response.escalated
          ? 'A human support ticket was opened and queued for review.'
          : `Support answered using the ${response.category.replace('_', ' ')} lane.`
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
    const lastUserMessage =
      [...messages].reverse().find(message => message.role === 'user')
        ?.content ?? '';
    const message =
      messageOverride?.trim() ||
      lastUserMessage.trim() ||
      draft.trim() ||
      selectedLane.defaultMessage;
    if (!message || loading) return;

    const shouldAppendUser =
      !lastUserMessage ||
      (messageOverride &&
        lastUserMessage.trim().toLowerCase() !== message.trim().toLowerCase());
    if (shouldAppendUser) {
      setMessages(current => [...current, { role: 'user', content: message }]);
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
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content:
            'A human support ticket has been opened and queued for review.',
        },
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
    <section className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E] mb-3 block">
                Support Center
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#F4F1EA] mb-4">
                Guided support first. Human review when it matters.
              </h2>
              <p className="max-w-3xl text-base text-[#C9CBCE] leading-relaxed">
                Pick a lane like receipts, verification, privacy, or app issues.
                The support assistant gives direct answers and escalates to a
                human ticket whenever your request needs billing, safety, or
                account review.
              </p>
            </div>
            <div className="bg-[#1A1E25] border border-[#3A3F45] rounded-xl px-6 py-4 text-sm text-[#C9CBCE]">
              <div className="flex items-center gap-2 font-mono font-medium text-[#FFD21E] mb-2 uppercase tracking-[0.14em] text-xs">
                <Headset size={16} /> Live support workflow
              </div>
              <div className="flex items-center gap-2 font-medium text-[#F4F1EA]">
                Lane <span className="text-[#9DA3AA]">{'->'}</span> Answer{' '}
                <span className="text-[#9DA3AA]">{'->'}</span> Escalate
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-[#FF6B6B] bg-[#1A1E25] px-5 py-4 text-sm font-semibold text-[#FF6B6B]"
            >
              {error}
            </motion.div>
          )}
          {notice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-[#3DDC97] bg-[#1A1E25] px-5 py-4 text-sm font-semibold text-[#3DDC97]"
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6 md:p-8 flex flex-col">
            <div className="flex flex-col gap-6 border-b border-[#3A3F45] pb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#F4F1EA]">
                    Choose a support lane
                  </h3>
                  <p className="mt-2 text-sm text-[#C9CBCE] leading-relaxed max-w-lg">
                    Pick the closest lane below and let the desk route your
                    request or open a ticket with full context attached.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleManualEscalation()}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-[#1A1E25] border border-[#FF6B6B] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#FF6B6B] disabled:opacity-50 transition-colors hover:bg-[#FF6B6B] hover:text-[#0A0B0D]"
                >
                  <ShieldAlert size={16} /> Open human ticket
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SUPPORT_LANES.map(lane => {
                  const Icon = lane.icon;
                  const isSelected = lane.id === selectedLane.id;
                  return (
                    <button
                      key={lane.id}
                      type="button"
                      onClick={() => void handleLaneSelect(lane)}
                      disabled={loading}
                      className={`relative flex flex-col text-left p-5 rounded-xl border transition-colors disabled:opacity-50 ${
                        isSelected
                          ? 'bg-[#1A1E25] border-[#FFD21E]'
                          : 'bg-[#0A0B0D] border-[#3A3F45] hover:border-[#C9CBCE]'
                      }`}
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#12151A] border border-[#3A3F45] text-[#FFD21E]">
                        <Icon size={20} />
                      </div>
                      <div className="font-display text-base font-bold text-[#F4F1EA]">
                        {lane.title}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#C9CBCE]">
                        {lane.description}
                      </p>
                      <div
                        className={`mt-auto pt-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] ${
                          isSelected ? 'text-[#FFD21E]' : 'text-[#9DA3AA]'
                        }`}
                      >
                        {isSelected ? 'Selected lane' : 'Ask support'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 bg-[#1A1E25] border border-[#3A3F45] rounded-xl p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#12151A] text-[#FFD21E]">
                    <SelectedLaneIcon size={22} />
                  </div>
                  <div>
                    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#FFD21E] mb-1">
                      Selected lane
                    </div>
                    <h4 className="font-display text-xl font-bold text-[#F4F1EA]">
                      {selectedLane.title}
                    </h4>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#C9CBCE]">
                      {selectedLane.guidance}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-[#3A3F45] bg-[#12151A] px-4 py-3 text-xs text-[#C9CBCE] leading-relaxed max-w-[220px]">
                  Human review is triggered automatically for billing, safety,
                  and account-access escalations.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedLane.actions.map(action =>
                  action.kind === 'link' && action.href ? (
                    <Link
                      key={action.label}
                      to={action.href}
                      className={actionButtonClasses(action.kind)}
                    >
                      <ExternalLink size={16} /> {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      disabled={loading}
                      onClick={() => void handleLaneAction(action)}
                      className={`${actionButtonClasses(action.kind)} disabled:opacity-50`}
                    >
                      {action.kind === 'ticket' ? (
                        <Ticket size={16} />
                      ) : (
                        <Send size={16} />
                      )}{' '}
                      {action.label}
                    </button>
                  )
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 font-mono text-[11px] text-[#9DA3AA]">
                {selectedLane.actions.map((action, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' · '} {action.hint}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex max-h-[400px] flex-col gap-4 overflow-y-auto pr-2">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${message.role}-${index}`}
                    className={`max-w-[85%] rounded-xl border px-5 py-4 text-sm leading-relaxed ${
                      message.role === 'assistant'
                        ? 'self-start bg-[#1A1E25] border-[#3A3F45] text-[#F4F1EA]'
                        : 'self-end bg-[#0A0B0D] border-[#FFD21E] text-[#F4F1EA]'
                    }`}
                  >
                    {message.content}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="self-start rounded-xl border border-[#3A3F45] bg-[#1A1E25] px-5 py-4 text-sm text-[#C9CBCE]">
                  Processing request...
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <textarea
                value={draft}
                onChange={event => setDraft(event.target.value)}
                rows={3}
                placeholder="Need something outside the guided lanes? Type it here."
                className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E] resize-none"
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-mono text-xs text-[#9DA3AA]">
                  Safety, billing, and access issues escalate with full
                  transcript.
                </div>
                <button
                  type="submit"
                  disabled={loading || draft.trim().length === 0}
                  className="ds-btn-signal flex items-center justify-center gap-2 px-6 py-3 text-sm disabled:opacity-50"
                >
                  <Send size={16} /> Send message
                </button>
              </div>
            </form>
          </article>

          <div className="grid gap-8 content-start">
            <aside className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 border-b border-[#3A3F45] pb-4 mb-6">
                <Ticket size={20} className="text-[#FFD21E]" />
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  My tickets
                </h3>
              </div>
              <p className="text-xs text-[#C9CBCE] leading-relaxed mb-6">
                Every escalation keeps the customer message and assistant reply
                together.
              </p>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {tickets.length === 0 ? (
                  <div className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6 text-center text-sm font-medium text-[#C9CBCE]">
                    No open tickets yet. Select a lane above to start a support
                    request.
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-sm font-bold text-[#F4F1EA]">
                            {ticket.subject}
                          </div>
                          <div className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#FFD21E]">
                            {ticket.category.replace('_', ' ')}
                          </div>
                        </div>
                        <span className="rounded border border-[#3A3F45] bg-[#12151A] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#C9CBCE] shrink-0">
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-sm text-[#C9CBCE] leading-relaxed border-l-2 border-[#3A3F45] pl-3">
                        {ticket.customer_message}
                      </div>
                      {ticket.bot_response && (
                        <div className="mt-4 rounded-lg border border-[#3A3F45] bg-[#12151A] p-4 text-xs leading-relaxed text-[#C9CBCE]">
                          <span className="font-bold text-[#F4F1EA] mr-2">
                            Assistant:
                          </span>
                          {ticket.bot_response}
                        </div>
                      )}
                      <div className="mt-4 font-mono text-[11px] text-[#9DA3AA]">
                        Opened {formatDate(ticket.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {operatorViewEnabled && (
              <aside className="bg-[#12151A] border border-[#FF6B6B] rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-3 border-b border-[#3A3F45] pb-4 mb-6">
                  <ShieldAlert size={20} className="text-[#FF6B6B]" />
                  <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                    Operator queue
                  </h3>
                </div>
                <p className="text-xs text-[#C9CBCE] leading-relaxed mb-6">
                  Visible only to configured operator accounts.
                </p>

                <div className="space-y-4">
                  {operatorTickets.slice(0, 5).map(ticket => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-5"
                    >
                      <div className="text-sm font-bold text-[#F4F1EA]">
                        {ticket.customer_email}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#FF6B6B]">
                        {ticket.category.replace('_', ' ')} ·{' '}
                        {ticket.escalation_reason || 'manual_review'}
                      </div>
                      <div className="mt-4 text-sm text-[#C9CBCE] leading-relaxed border-l-2 border-[#FF6B6B] pl-3">
                        {ticket.customer_message}
                      </div>
                      {ticket.bot_response && (
                        <div className="mt-4 rounded-lg border border-[#3A3F45] bg-[#12151A] p-4 text-xs leading-relaxed text-[#C9CBCE]">
                          <span className="font-bold text-[#F4F1EA] mr-2">
                            Assistant:
                          </span>
                          {ticket.bot_response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Support;
