(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('afterglow-theme') || 'iris';
  const savedContrast = localStorage.getItem('afterglow-contrast') || 'standard';
  root.dataset.theme = savedTheme;
  root.dataset.contrast = savedContrast;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let toastTimer;
  const announce = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  document.querySelectorAll('[data-theme]').forEach((button) => {
    if (!button.matches('.swatch')) return;
    button.addEventListener('click', () => {
      const theme = button.dataset.theme;
      root.dataset.theme = theme;
      localStorage.setItem('afterglow-theme', theme);
      document.querySelectorAll('.swatch').forEach((item) => item.classList.toggle('active', item === button));
      announce(`Theme changed to ${theme}.`);
    });
  });

  document.querySelectorAll('[data-contrast]').forEach((control) => {
    control.checked = root.dataset.contrast === 'high';
    control.addEventListener('change', () => {
      root.dataset.contrast = control.checked ? 'high' : 'standard';
      localStorage.setItem('afterglow-contrast', root.dataset.contrast);
      announce(control.checked ? 'High contrast enabled.' : 'Standard contrast enabled.');
    });
  });

  document.querySelectorAll('[data-choice]').forEach((choice) => {
    choice.addEventListener('click', () => {
      const group = choice.closest('[data-choice-group]');
      group?.querySelectorAll('[data-choice]').forEach((item) => item.classList.remove('selected'));
      choice.classList.add('selected');
      choice.setAttribute('aria-pressed', 'true');
      announce(`${choice.dataset.choice} selected.`);
    });
  });

  const introName = document.querySelector('[data-intro-name]');
  const introDetail = document.querySelector('[data-intro-detail]');
  const sequence = [
    { name: 'Mira, 29', detail: 'Sunday ceramics Â· quiet humor Â· wants a real pace' },
    { name: 'Avery, 31', detail: 'Neighborhood walks Â· bookshops Â· long-term curious' },
    { name: 'Noor, 27', detail: 'Home cooking Â· live music Â· intentional connection' }
  ];
  let sequenceIndex = 0;
  document.querySelectorAll('[data-orbit-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.orbitAction;
      if (action === 'open') {
        announce('Thread opened with a shared-context starter.');
      } else if (action === 'ask') {
        announce('A thoughtful question draft is ready.');
      } else {
        sequenceIndex = (sequenceIndex + 1) % sequence.length;
        const next = sequence[sequenceIndex];
        if (introName) introName.textContent = next.name;
        if (introDetail) introDetail.textContent = next.detail;
        announce('Passed quietly. Here is another introduction.');
      }
    });
  });

  const shieldState = document.querySelector('[data-shield-state]');
  const shieldCopy = document.querySelector('[data-shield-copy]');
  document.querySelectorAll('[data-shield-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.shieldAction;
      if (action === 'review') {
        if (shieldState) shieldState.textContent = 'In review';
        if (shieldCopy) shieldCopy.textContent = 'A review request is staged in this frontend demonstration. No identity data has been collected.';
        announce('Verification review is staged, not submitted.');
      }
      if (action === 'report') announce('Report flow opened. In production this requires a monitored support route.');
      if (action === 'learn') document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const verifyState = document.querySelector('[data-verification-state]');
  const verifyDetail = document.querySelector('[data-verification-detail]');
  document.querySelectorAll('[data-verify-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.verifyAction;
      if (action === 'start') {
        if (verifyState) verifyState.textContent = 'In review';
        if (verifyDetail) verifyDetail.textContent = 'This frontend prototype has staged a consent state. A production server must create the verification session, handle the webhook, and confirm final status.';
        announce('Consent state staged. No Plaid session was created.');
      }
      if (action === 'skip') announce('You can continue without verification.');
      if (action === 'retry') {
        if (verifyState) verifyState.textContent = 'Not started';
        if (verifyDetail) verifyDetail.textContent = 'Verification is optional. You remain in control of whether to begin.';
        announce('Verification state reset.');
      }
    });
  });

  document.querySelectorAll('[data-login]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      announce('Sign-in is staged in this frontend-only prototype.');
    });
  });

  document.querySelectorAll('[data-mock-submit]').forEach((button) => {
    button.addEventListener('click', () => announce(button.dataset.mockSubmit || 'Saved locally for this demonstration.'));
  });
})();

// bot-shield verification state controller.

// PaperMates safety-center prototype controls. No account, location, identity,
// contact, model, or network action is created by these UI-only handlers.
(() => {
  const announce = (message) => {
    let node = document.querySelector('[data-papermates-announce]');
    if (!node) {
      node = document.createElement('div');
      node.dataset.papermatesAnnounce = 'true';
      node.className = 'sr-only';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      node.setAttribute('aria-atomic', 'true');
      document.body.append(node);
    }
    node.textContent = message;
  };

  const consentChoices = Array.from(document.querySelectorAll('[data-consent-choice]'));
  consentChoices.forEach((button) => {
    button.addEventListener('click', () => {
      consentChoices.forEach((choiceButton) => choiceButton.setAttribute('aria-pressed', choiceButton === button ? 'true' : 'false'));
      const status = document.querySelector('[data-consent-status]');
      const choice = button.dataset.consentChoice;
      if (status) status.textContent = choice === 'preferences'
        ? 'Preference choice staged locally for this demonstration. A production service must record consent and provide a way to revise it.'
        : 'Essential-only preference staged locally for this demonstration. No optional preferences are stored here.';
      announce('Consent preference updated in the frontend demonstration.');
    });
  });

  const safetyMessages = {
    age: 'Age scope reviewed. Production age assurance is not performed by this prototype.',
    'bot-check': 'Trust-state example: a signal can request human review, but it is not a verdict or a safety guarantee.',
    report: 'Report flow staged. A production service must collect only necessary evidence, confirm receipt, and offer a review route.',
    block: 'Block flow staged. No person was blocked because this prototype has no account service.',
    'check-in': 'Personal check-in reminder staged. No trusted contact, calendar item, location, or notification was created.',
    'circle-date': 'Circle Date concept opened. Group membership and information sharing require explicit production consent.',
  };
  const safetyStatus = document.querySelector('[data-safety-status]');
  document.querySelectorAll('[data-safety-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const message = safetyMessages[button.dataset.safetyAction] || 'Action staged locally for this demonstration.';
      if (safetyStatus) safetyStatus.textContent = message;
      announce(message);
    });
  });
})();



