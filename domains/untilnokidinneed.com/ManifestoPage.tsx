/**
 * Misses Trollz - /manifesto
 */
import React from 'react';
import { CORE_LAW, MANIFESTO_SUBTITLE, MANIFESTO_TITLE, MISSION } from '../constants/policy';
import { PolicyPage, Section, inlineLink } from './PolicyPage';

/** One plain sentence per line of the core law: what it means in this project. */
const IN_PRACTICE: Record<(typeof CORE_LAW)[number], string> = {
  'One Mission.': 'Every change is weighed against the mission. A change that does not serve it is declined.',
  'Many Viewpoints.': 'Tests, a scope check and human review look at each change before it lands.',
  'Zero Blind Trust.': 'Nothing is accepted because someone says it works. It is checked in public first.',
  'Human Accountability.': 'A person answers for every release. AI tools assist; they do not decide.',
  'Perpetual Stewardship.': 'Open licenses let anyone keep a copy running and safe, with or without the original team.',
  'Leave It Better Than You Found It.': 'Each change should leave the app safer, clearer or kinder than before.',
};

export const ManifestoPage: React.FC = () => (
  <PolicyPage title={MANIFESTO_TITLE} subtitle={MANIFESTO_SUBTITLE}>
    <Section id="mission" title="The mission">
      <p>{MISSION}</p>
    </Section>

    <Section id="core-law" title="Core Law">
      <ol className="space-y-2 rounded-2xl border-2 border-amber-300 bg-slate-900 p-5">
        {CORE_LAW.map((line) => (
          <li key={line} className="text-xl font-black text-slate-50">
            {line}
          </li>
        ))}
      </ol>
    </Section>

    <Section id="practice" title="In practice">
      <dl className="space-y-3">
        {CORE_LAW.map((line) => (
          <div key={line}>
            <dt className="font-black text-amber-300">{line}</dt>
            <dd>{IN_PRACTICE[line]}</dd>
          </div>
        ))}
      </dl>
    </Section>

    <Section id="children" title="Children first">
      <p>
        The rules that protect children come before everything above.{' '}
        <a href="#/child-safety" className={inlineLink}>
          Read the Child Safety Commitment
        </a>
        .
      </p>
      <p>
        How decisions are made and who answers for them is on the{' '}
        <a href="#/governance" className={inlineLink}>
          Governance
        </a>{' '}
        page.
      </p>
    </Section>
  </PolicyPage>
);
