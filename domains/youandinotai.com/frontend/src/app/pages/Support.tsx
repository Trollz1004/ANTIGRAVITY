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
    guidance: 'Use this lane when the payment went through but you need the receipt or payment record checked.',
    defaultMessage: 'I need help finding my Square receipt or payment confirmation.',
    icon: ReceiptText,
    accentClass: 'from-cyan-400/20 via-blue-500/15 to-transparent border-cyan-400/30 text-cyan-400',
    actions: [
      { label: 'Receipt still missing', hint: 'Escalate a billing review ticket.', kind: 'ticket', value: 'I still cannot find my Square receipt. Please open a billing review ticket.' },
      { label: 'Founder billing question', hint: 'Ask about a subscription or founder charge.', kind: 'message', value: 'I need help with a Founding Member or other founder-plan charge.' },
    ],
  },
  {
    id: 'verification',
    title: 'Verified Badge',
    description: 'Liveness, badge status, and access after Bot-Shield.',
    guidance: 'Use this lane if you finished verification but the badge or access state looks wrong.',
    defaultMessage: 'I completed Bot-Shield but my verified badge did not update.',
    icon: BadgeCheck,
    accentClass: 'from-emerald-400/20 via-cyan-500/15 to-transparent border-emerald-400/30 text-emerald-400',
    actions: [
      { label: 'Badge still missing', hint: 'Open a verification review ticket.', kind: 'ticket', value: 'I completed the liveness check and payment, but my verified badge still has not updated.' },
      { label: 'Retry help', hint: 'Ask for the next step before escalating.', kind: 'message', value: 'The verification flow failed and I need help understanding the next step.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    description: 'Export, deletion requests, and location tracking controls.',
    guidance: 'Use this lane for privacy settings or when a privacy request did not process correctly.',
    defaultMessage: 'I need help with privacy controls, data export, or account deletion.',
    icon: Lock,
    accentClass: 'from-fuchsia-400/20 via-violet-500/15 to-transparent border-fuchsia-400/30 text-fuchsia-400',
    actions: [
      { label: 'Open Data & Privacy', hint: 'Go to the control panel directly.', kind: 'link', href: '/app/privacy' },
      { label: 'Privacy request failed', hint: 'Escalate to a human review ticket.', kind: 'ticket', value: 'My privacy or data request did not process correctly and I need human review.' },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    description: 'Founding Member status, recurring billing, and charge corrections.',
    guidance: 'Use this lane when the active subscription state looks wrong or a renewal needs review.',
    defaultMessage: 'I need help with my subscription, founding member status, or billing.',
    icon: CreditCard,
    accentClass: 'from-amber-400/20 via-orange-500/15 to-transparent border-amber-400/30 text-amber-400',
    actions: [
      { label: 'Open billing ticket', hint: 'Human review for a recurring charge or renewal issue.', kind: 'ticket', value: 'I need human help with a subscription, renewal, or billing issue.' },
      { label: 'Charged twice', hint: 'Tell the bot exactly what happened.', kind: 'message', value: 'I believe I was charged twice or my subscription status looks wrong.' },
    ],
  },
  {
    id: 'technical',
    title: 'Bug or App Issue',
    description: 'Messages, boards, video, profile, or anything broken in the app.',
    guidance: 'Use this lane when a feature is failing and you want the transcript attached to the ticket.',
    defaultMessage: 'The app is not working correctly and I need technical help.',
    icon: Bug,
    accentClass: 'from-rose-400/20 via-pink-500/15 to-transparent border-rose-400/30 text-rose-400',
    actions: [
      { label: 'Open technical ticket', hint: 'Escalate with the current transcript.', kind: 'ticket', value: 'The app has a bug and I need technical support with a human review.' },
      { label: 'Describe the failure', hint: 'Start a guided bug report in chat.', kind: 'message', value: 'Messages, video, or another feature is not working correctly and I want to report the exact failure.' },
    ],
  },
  {
    id: 'safety',
    title: 'Report a User',
    description: 'Unsafe behavior, harassment, fraud, or anything that needs fast review.',
    guidance: 'Use this lane for safety issues. It should escalate quickly and keep the record together.',
    defaultMessage: 'I need to report unsafe behavior, harassment, fraud, or another safety issue.',
    icon: ShieldAlert,
    accentClass: 'from-red-500/20 via-rose-500/15 to-transparent border-red-400/35 text-red-500',
    actions: [
      { label: 'Open safety review', hint: 'Send this straight to the human queue.', kind: 'ticket', value: 'I need a human safety review for harassment, fraud, or another unsafe situation.' },
      { label: 'Safety guidance', hint: 'Ask for the immediate next step.', kind: 'message', value: 'I need immediate guidance for a safety problem or user report.' },
    ],
  },
];

const initialAssistantMessage: SupportChatMessage = {
  role: 'assistant',
  content: 'Choose a support lane below to get a fast preset answer. You can still type a custom question, and anything sensitive or uncertain can be escalated to a human.',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function actionButtonClasses(kind: SupportActionKind): string {
  return 'flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md hover:bg-white/10 transition-colors shadow-sm';
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
    () => messages.filter(message => message.content.trim().length > 0).map(message => ({ role: message.role, content: message.content })),
    [messages]
  );

  const selectedLane = useMemo(
    () => SUPPORT_LANES.find(lane => lane.id === selectedLaneId) ?? SUPPORT_LANES[0],
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
      const response = await api.post<SupportChatResponse>('/support/chat', { message: trimmed, transcript });
      setMessages(current => [...current, { role: 'assistant', content: response.reply }]);
      if (response.ticket) {
        prependTicket(response.ticket as SupportTicketResponse);
      }
      setNotice(response.escalated ? 'A human support ticket was opened and queued for review.' : `Support answered using the ${response.category.replace('_', ' ')} lane.`);
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
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
    const message = messageOverride?.trim() || lastUserMessage.trim() || draft.trim() || selectedLane.defaultMessage;
    if (!message || loading) return;

    const shouldAppendUser = !lastUserMessage || (messageOverride && lastUserMessage.trim().toLowerCase() !== message.trim().toLowerCase());
    if (shouldAppendUser) {
      setMessages(current => [...current, { role: 'user', content: message }]);
    }

    setLoading(true);
    setNotice(null);
    setError(null);

    try {
      const ticket = await api.post<SupportTicketResponse>('/support/tickets', { message, transcript: conversationTranscript });
      prependTicket(ticket);
      setMessages(current => [...current, { role: 'assistant', content: 'A human support ticket has been opened and queued for review.' }]);
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
    <section className="min-h-screen bg-[#050505] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] block">Support Center</span>
              <h2 className="text-4xl font-black tracking-tight mb-4">Guided support first. Human review when it actually matters.</h2>
              <p className="max-w-3xl text-lg text-white/60 leading-relaxed">
                Pick a lane like receipts, verification, privacy, or app issues. The support assistant stays narrow, gives preset answers, and escalates only when the request needs billing, safety, access, or human judgment.
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white/50 backdrop-blur-md">
              <div className="flex items-center gap-2 font-bold text-cyan-400 mb-2 uppercase tracking-widest text-xs">
                <Headset size={16} /> Live support workflow
              </div>
              <div className="flex items-center gap-2 font-medium">
                Lane <span className="text-white/20">{'->'}</span> Answer <span className="text-white/20">{'->'}</span> Escalate
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl border border-red-500/50 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              {error}
            </motion.div>
          )}
          {notice && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-200 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <motion.article initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
            <div className="flex flex-col gap-6 border-b border-white/10 pb-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Choose a support lane</h3>
                  <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-lg">
                    This works more like a live help desk than an open-ended chatbot. Pick the closest lane and let the system route it.
                  </p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => void handleManualEscalation()} disabled={loading} className="flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/50 px-5 py-3 text-sm font-bold uppercase tracking-widest text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 transition-colors hover:bg-red-500/30">
                  <ShieldAlert size={16} /> Open human ticket
                </motion.button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SUPPORT_LANES.map((lane, i) => {
                  const Icon = lane.icon;
                  const isSelected = lane.id === selectedLane.id;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={lane.id}
                      type="button"
                      onClick={() => void handleLaneSelect(lane)}
                      disabled={loading}
                      className={`relative flex flex-col text-left p-5 rounded-3xl border transition-all duration-300 disabled:opacity-50 ${isSelected ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br border border-white/10 ${lane.accentClass}`}>
                        <Icon size={20} />
                      </div>
                      <div className={`text-base font-black tracking-wide ${isSelected ? 'text-white' : 'text-white/80'}`}>{lane.title}</div>
                      <p className={`mt-2 text-xs leading-relaxed ${isSelected ? 'text-white/70' : 'text-white/40'}`}>{lane.description}</p>
                      <div className={`mt-auto pt-4 text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-fuchsia-400' : 'text-cyan-400/50'}`}>
                        {isSelected ? 'Selected lane' : 'Ask support'}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 bg-black/30 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${selectedLane.accentClass}`}>
                    <SelectedLaneIcon size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400 mb-1">Selected lane</div>
                    <h4 className="text-xl font-black text-white tracking-wide">{selectedLane.title}</h4>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">{selectedLane.guidance}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50 leading-relaxed max-w-[200px]">
                  The operator only gets pulled in when billing, safety, access, or uncertainty crosses the line.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedLane.actions.map(action =>
                  action.kind === 'link' && action.href ? (
                    <Link key={action.label} to={action.href} className={actionButtonClasses(action.kind)}>
                      <ExternalLink size={16} /> {action.label}
                    </Link>
                  ) : (
                    <button key={action.label} type="button" disabled={loading} onClick={() => void handleLaneAction(action)} className={`${actionButtonClasses(action.kind)} disabled:opacity-50`}>
                      {action.kind === 'ticket' ? <Ticket size={16} /> : <Send size={16} />} {action.label}
                    </button>
                  )
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-widest text-white/30">
                {selectedLane.actions.map((action, idx) => (
                  <span key={idx}>{idx > 0 && ' • '} {action.hint}</span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex max-h-[400px] flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`${message.role}-${index}`}
                    className={`max-w-[85%] rounded-3xl border px-6 py-4 text-sm leading-relaxed backdrop-blur-md ${
                      message.role === 'assistant'
                        ? 'self-start bg-white/10 border-white/20 text-white shadow-[0_4px_20px_rgba(255,255,255,0.05)] rounded-tl-sm'
                        : 'self-end bg-gradient-to-br from-fuchsia-600/80 to-cyan-600/80 border-white/20 text-white shadow-[0_4px_20px_rgba(217,70,239,0.2)] rounded-tr-sm'
                    }`}
                  >
                    {message.content}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start rounded-3xl border border-white/20 bg-white/5 px-6 py-4 text-sm text-white/50 backdrop-blur-md rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </div>
                </motion.div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <textarea
                value={draft}
                onChange={event => setDraft(event.target.value)}
                rows={3}
                placeholder="Need something outside the guided lanes? Type it here."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all backdrop-blur-sm resize-none"
              />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Safety, billing disputes, and access issues auto-escalate.
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading || draft.trim().length === 0} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 transition-opacity">
                  <Send size={16} /> Send message
                </motion.button>
              </div>
            </form>
          </motion.article>

          <div className="grid gap-8 content-start">
            <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                <Ticket size={20} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <h3 className="text-lg font-black text-white uppercase tracking-widest">My tickets</h3>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-6">Every escalation keeps the customer message and bot reply together.</p>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {tickets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center text-sm font-medium text-white/40">
                    No support tickets yet.
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <motion.div whileHover={{ scale: 1.02 }} key={ticket.id} className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md shadow-lg transition-transform">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-sm font-bold text-white tracking-wide">{ticket.subject}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.3)]">{ticket.category.replace('_', ' ')}</div>
                        </div>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-cyan-400 shrink-0">
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 leading-relaxed border-l-2 border-white/10 pl-3">
                        {ticket.customer_message}
                      </div>
                      {ticket.bot_response && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/60">
                          <span className="font-bold text-white/80 mr-2">Bot:</span>{ticket.bot_response}
                        </div>
                      )}
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        Opened {formatDate(ticket.created_at)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>

            {operatorViewEnabled && (
              <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-red-500/5 border border-red-500/20 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-red-500/20 pb-4 mb-6">
                  <ShieldAlert size={20} className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                  <h3 className="text-lg font-black text-white uppercase tracking-widest">Operator queue</h3>
                </div>
                <p className="text-xs text-red-200/50 leading-relaxed mb-6">Visible only to configured operator accounts.</p>

                <div className="space-y-4">
                  {operatorTickets.slice(0, 5).map(ticket => (
                    <div key={ticket.id} className="rounded-2xl border border-red-500/20 bg-black/40 p-5 backdrop-blur-md">
                      <div className="text-sm font-bold text-white tracking-wide">{ticket.customer_email}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">
                        {ticket.category.replace('_', ' ')} · {ticket.escalation_reason || 'manual_review'}
                      </div>
                      <div className="mt-4 text-sm text-white/80 leading-relaxed border-l-2 border-red-500/20 pl-3">
                        {ticket.customer_message}
                      </div>
                      {ticket.bot_response && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/60">
                          <span className="font-bold text-white/80 mr-2">Bot:</span>{ticket.bot_response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Support;
