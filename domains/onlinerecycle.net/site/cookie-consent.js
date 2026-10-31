(function () {
  const consentKey = 'or_cookie_consent';
  const banner = document.getElementById('cookie-banner');
  const acceptButton = document.getElementById('cb-accept-btn');
  const declineButton = document.getElementById('cb-decline-btn');
  const analyticsCheckbox = document.getElementById('cb-analytics');
  const functionalCheckbox = document.getElementById('cb-functional');
  const manageCookiesLink = document.getElementById('manage-cookies-link');
  const optionsButton = document.getElementById('cb-options-btn');
  const checks = document.getElementById('cb-checks');

  function showOptions() {
    if (checks) checks.hidden = false;
    if (optionsButton) {
      optionsButton.hidden = true;
      optionsButton.setAttribute('aria-expanded', 'true');
    }
    declineButton.hidden = false;
    acceptButton.textContent = 'Accept Selected';
  }

  if (!banner || !acceptButton || !declineButton) {
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(consentKey) || 'null');
    if (stored && stored.decided) {
      banner.style.display = 'none';
    }
  } catch (_error) {
    // Ignore malformed local storage and fall back to showing the banner.
  }

  function saveConsent(analytics, functional) {
    try {
      localStorage.setItem(
        consentKey,
        JSON.stringify({
          decided: true,
          analytics,
          functional,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (_error) {
      // Ignore storage failures and still hide the banner for this session.
    }

    banner.style.display = 'none';
  }

  acceptButton.addEventListener('click', function () {
    saveConsent(
      Boolean(analyticsCheckbox && analyticsCheckbox.checked),
      Boolean(functionalCheckbox && functionalCheckbox.checked),
    );
  });

  declineButton.addEventListener('click', function () {
    saveConsent(false, false);
  });

  if (optionsButton) {
    optionsButton.addEventListener('click', showOptions);
  }

  if (manageCookiesLink) {
    manageCookiesLink.addEventListener('click', function (event) {
      event.preventDefault();
      try {
        localStorage.removeItem(consentKey);
      } catch (_error) {
        // Storage blocked; still reopen the banner.
      }
      showOptions();
      banner.style.display = 'block';
    });
  }
})();
