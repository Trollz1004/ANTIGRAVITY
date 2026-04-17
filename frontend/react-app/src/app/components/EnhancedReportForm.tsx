import { useState } from 'react';
import { Calendar, Paperclip, AlertTriangle } from 'lucide-react';

const REPORT_REASONS = [
  {
    value: 'harassment',
    label: 'Harassment or threats',
    description:
      'Includes bullying, stalking, threats of violence, hate speech',
  },
  {
    value: 'spam',
    label: 'Spam or solicitation',
    description: 'Unwanted promotional content or persistent messaging',
  },
  {
    value: 'impersonation',
    label: 'Impersonation',
    description: 'Someone pretending to be someone else',
  },
  {
    value: 'minor-risk',
    label: 'Possible minor-safety issue',
    description: 'Concern about underage user or inappropriate conduct',
  },
  {
    value: 'scam',
    label: 'Scam or payment manipulation',
    description: 'Financial fraud or deceptive payment schemes',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate content',
    description: 'Explicit images, offensive material, or violating content',
  },
  {
    value: 'other',
    label: 'Other safety concern',
    description: 'Any other safety issue not covered above',
  },
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Not Urgent', color: 'bg-gray-400' },
  { value: 'medium', label: 'Serious', color: 'bg-orange-500' },
  { value: 'high', label: 'Critical', color: 'bg-red-500' },
];

const CONTEXT_CHECKBOXES = [
  { id: 'affected-others', label: 'This affected others' },
  { id: 'messaged-friend', label: "I've messaged a friend about this" },
  { id: 'uncomfortable-irl', label: 'I feel uncomfortable meeting IRL' },
  { id: 'contacted-authorities', label: "I've contacted authorities" },
];

interface EnhancedReportFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EnhancedReportForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: EnhancedReportFormProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [evidence, setEvidence] = useState<File[]>([]);
  const [urgency, setUrgency] = useState('medium');
  const [context, setContext] = useState<Record<string, boolean>>({});
  const [showMoreReasons, setShowMoreReasons] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      reason,
      details,
      incidentDate,
      evidence,
      urgency,
      context,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setEvidence(prev => [...prev, ...files]);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          Select a reason for your report
        </label>

        <div className="relative">
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="app-input w-full appearance-none pr-10"
          >
            <option value={REPORT_REASONS[0].value}>
              {REPORT_REASONS[0].label}
            </option>
          </select>

          {!showMoreReasons && (
            <button
              type="button"
              onClick={() => setShowMoreReasons(true)}
              className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ff4f00]"
            >
              More reasons
            </button>
          )}
        </div>

        {REPORT_REASONS.find(r => r.value === reason)?.description && (
          <p className="mt-2 text-xs text-gray-600">
            {REPORT_REASONS.find(r => r.value === reason)?.description}
          </p>
        )}

        {showMoreReasons && (
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3">
            {REPORT_REASONS.slice(1).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setReason(option.value);
                  setShowMoreReasons(false);
                }}
                className={`text-left text-sm ${reason === option.value ? 'font-bold text-[#ff4f00]' : 'text-gray-700'}`}
              >
                {option.label}
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          When did this happen?
        </label>
        <div className="relative">
          <input
            type="date"
            value={incidentDate}
            onChange={e => setIncidentDate(e.target.value)}
            className="app-input w-full pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          Describe what happened
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          rows={4}
          placeholder="I noticed..."
          className="app-input min-h-[8rem] resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          Add evidence (optional)
        </label>
        <div className="flex items-center gap-2">
          <label className="app-button-outline cursor-pointer justify-center px-4 py-2 text-sm">
            <Paperclip size={16} />
            Add Photos/Videos
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {evidence.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {evidence.map((file, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs">
                  <Paperclip size={12} className="text-gray-500" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeEvidence(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          Is this urgent?
        </label>
        <div className="flex gap-4">
          {URGENCY_LEVELS.map(level => (
            <label key={level.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="urgency"
                value={level.value}
                checked={urgency === level.value}
                onChange={e => setUrgency(e.target.value)}
                className="h-4 w-4 text-[#ff4f00]"
              />
              <span
                className={`inline-block h-3 w-3 rounded-full ${level.color}`}
              ></span>
              <span className="text-sm">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-black uppercase tracking-[0.14em] text-[#5c594f] mb-3">
          Additional context
        </label>
        <div className="space-y-2">
          {CONTEXT_CHECKBOXES.map(checkbox => (
            <label key={checkbox.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={context[checkbox.id] || false}
                onChange={e =>
                  setContext(prev => ({
                    ...prev,
                    [checkbox.id]: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#ff4f00] focus:ring-[#ff4f00]"
              />
              <span className="text-sm">{checkbox.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="app-button-accent flex-1 justify-center px-5 py-3 disabled:opacity-60"
        >
          {isLoading ? 'Submitting Report...' : 'Submit Report'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="app-button-outline flex-1 justify-center px-5 py-3"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
