/**
 * Misses Trollz - /governance
 * Every claim here can be checked in the public repository.
 */
import React from 'react';
import { MISSION, REPO_URL } from '../constants/policy';
import { PolicyPage, Section, inlineLink } from './PolicyPage';

export const GovernancePage: React.FC = () => (
  <PolicyPage title="Governance" subtitle="How decisions are made, and who answers for them.">
    <Section id="mission-first" title="Mission first">
      <p>{MISSION}</p>
      <p>Every proposed change is judged by whether it serves that mission safely. If it does not, it is declined.</p>
    </Section>

    <Section id="accountability" title="Human accountability">
      <p>
        A person maintains this project and is accountable for every release: Joshua Coleman (GitHub: Trollz1004). AI
        tools help draft code and text. They do not approve changes, own anything, or hold any role here.
      </p>
    </Section>

    <Section id="viewpoints" title="Independent viewpoints">
      <p>
        Each change is looked at from more than one angle before it lands: the automated test suite, a scope check
        over every word the avatar can say, and review of the pull request. When an AI model reviews a change, its
        review is one input to a human decision, never the decision.
      </p>
    </Section>

    <Section id="verification" title="Verification before trust">
      <p>
        The main branch only accepts changes through a pull request, and a pull request cannot merge until the
        approved-scope check and the 90 percent test gate pass. Those checks run in public on GitHub for every change.
      </p>
    </Section>

    <Section id="transparency" title="Transparency">
      <p>
        The code, the rules the avatar follows, the approved word banks and the test results are public.{' '}
        <a href={REPO_URL} className={inlineLink}>
          Read them in the repository
        </a>
        .
      </p>
    </Section>

    <Section id="stewardship" title="Perpetual stewardship">
      <p>
        The code is MIT licensed and the art, text and word banks are CC0, so the project can outlive any one
        maintainer. Anyone may keep a copy running, keep it safe, and leave it better than they found it.
      </p>
    </Section>

    <Section id="not" title="What AI does not do here">
      <p>
        AI has no authority, ownership, legal rights or vote in this project, and it is not a person. People are
        accountable for every decision.
      </p>
    </Section>

    <Section id="children" title="Children first">
      <p>
        <a href="#/child-safety" className={inlineLink}>
          Read the Child Safety Commitment
        </a>
        .
      </p>
    </Section>
  </PolicyPage>
);
