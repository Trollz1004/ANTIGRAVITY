/**
 * Misses Trollz - /child-safety
 * The commitment is rendered from src/constants/policy.ts, word for word.
 */
import React from 'react';
import { CHILD_SAFETY_RULES, CHILD_SAFETY_STATEMENTS, CHILD_SAFETY_TITLE, LEGAL_NOTICE, REPO_URL } from '../constants/policy';
import { PolicyPage, Section, inlineLink } from './PolicyPage';

export const ChildSafetyPage: React.FC = () => (
  <PolicyPage title="Child Safety">
    <Section id="commitment" title={CHILD_SAFETY_TITLE}>
      <div className="space-y-2 rounded-2xl border-2 border-amber-300 bg-slate-900 p-5">
        {CHILD_SAFETY_STATEMENTS.map((line) => (
          <p key={line} className="text-xl font-black text-slate-50">
            {line}
          </p>
        ))}
      </div>
      <ul className="list-disc space-y-2 pl-6 text-lg">
        {CHILD_SAFETY_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </Section>

    <Section id="how" title="How the app keeps to it">
      <ul className="list-disc space-y-2 pl-6">
        <li>The kid screen has big buttons only. There is no text box, so a child is never asked to type anything.</li>
        <li>The avatar never asks for a name, age, school, room or bed number, or why someone is in hospital.</li>
        <li>Her scripted lines come from approved word banks. If the optional AI lines are turned on, each AI reply must carry the caregiver line, stay at 120 words or fewer and pass the blocked-word and personal-question checks, or a scripted line is shown instead.</li>
        <li>A "Grown-up needed" button stops the game and shows: If anyone needs help, please tell a nurse or caregiver right away.</li>
        <li>Settings sit behind a button a grown-up must hold for three seconds.</li>
        <li>Sound and the optional AI lines are off until a grown-up turns them on. The AI lines only talk to a model on the same computer.</li>
        <li>There are no accounts, no ads, no purchases and no analytics.</li>
      </ul>
    </Section>

    <Section id="notice" title="Notice">
      {LEGAL_NOTICE.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </Section>

    <Section id="concern" title="Report a concern">
      <p>
        If you see anything in this app that breaks these rules, report it privately through{' '}
        <a href={`${REPO_URL}/security`} className={inlineLink}>
          the repository's security page
        </a>
        . Reports are read by a person.
      </p>
    </Section>
  </PolicyPage>
);
