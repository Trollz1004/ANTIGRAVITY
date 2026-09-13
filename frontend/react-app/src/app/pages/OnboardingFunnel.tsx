import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, ShieldCheck } from 'lucide-react';

const STEPS = ['profile', 'verify', 'subscribe'] as const;
type Step = typeof STEPS[number];

const stepIcons = {
  profile: Camera,
  verify: ShieldCheck,
  subscribe: Heart,
};

const stepTitles = {
  profile: 'Create your profile',
  verify: 'Verify your account',
  subscribe: 'Choose your plan',
};

const stepDescriptions = {
  profile: 'Add a bio, interests, and a prompt so people can find you.',
  verify: 'Complete the $1 Bot-Shield verification to unlock discovery and matching.',
  subscribe: 'Founding Member at $14.99/mo. Cancel anytime.',
};

const stepCTAs = {
  profile: 'Set up profile',
  verify: 'Verify now',
  subscribe: 'Subscribe',
};

export function OnboardingFunnel() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('profile');
  const Icon = stepIcons[step];

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (step === 'profile') navigate('/app/profile');
    else if (step === 'verify') navigate('/app/verify');
    else if (step === 'subscribe') navigate('/app/checkout/founding_member');
    else if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else navigate('/app/discover');
  };

  return (
    <div className="app-page">
      <div className="app-page-inner max-w-3xl">
        <div className="mb-8">
          <div className="app-kicker mb-3">Getting Started</div>
          <h1 className="app-title">let's get you set up.</h1>
          <p className="app-subtitle mt-4 max-w-2xl">
            Three steps to unlock the full platform.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full border-2 border-[#111111] ${
                STEPS.indexOf(s) <= STEPS.indexOf(step)
                  ? 'bg-[#111111]'
                  : 'bg-white'
              }`}
            />
          ))}
        </div>

        <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] text-white">
            <Icon size={28} />
          </div>

          <div className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#a78bfa]">
            Step {STEPS.indexOf(step) + 1} of 3
          </div>
          <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-[#111111]">
            {stepTitles[step]}
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-[#5c594f]">
            {stepDescriptions[step]}
          </p>

          <button
            onClick={next}
            className="app-button-accent mt-8 inline-flex items-center gap-2 px-6 py-4"
          >
            {stepCTAs[step]}
          </button>
        </div>
      </div>
    </div>
  );
}
