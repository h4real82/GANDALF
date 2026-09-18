export function initModals(
  appendLog: (prefix: string, text: string, cls?: string) => void,
  showToast: (tag: string, msg: string) => void
) {
  const holoModal = document.getElementById('zen-holo-modal');
  const deckModal = document.getElementById('deck-hub-modal');
  const btnCloseHolo = document.getElementById('btn-close-zen-holo');
  const btnCloseDeck = document.getElementById('btn-close-deck-hub');
  const navAutoDj = document.getElementById('nav-tab-autodj');
  const navSoundboard = document.getElementById('nav-tab-soundboard');
  const navZenHolo = document.getElementById('nav-tab-zen-holo');
  const navDeckHub = document.getElementById('nav-tab-deck-hub');
  const headerAvatar = document.getElementById('header-avatar-btn');

  function openHolo() {
    if (holoModal) holoModal.classList.remove('hidden');
    if (deckModal) deckModal.classList.add('hidden');
  }

  function closeHolo() {
    if (holoModal) holoModal.classList.add('hidden');
  }

  function openDeck() {
    if (deckModal) deckModal.classList.remove('hidden');
    if (holoModal) holoModal.classList.add('hidden');
  }

  function closeDeck() {
    if (deckModal) deckModal.classList.add('hidden');
  }

  if (btnCloseHolo) btnCloseHolo.addEventListener('click', closeHolo);
  if (btnCloseDeck) btnCloseDeck.addEventListener('click', closeDeck);
  if (navZenHolo) navZenHolo.addEventListener('click', openHolo);
  if (headerAvatar) headerAvatar.addEventListener('click', openHolo);
  if (navDeckHub) navDeckHub.addEventListener('click', openDeck);

  if (navAutoDj) {
    navAutoDj.addEventListener('click', () => {
      const box = document.getElementById('drop-target-box');
      if (box) box.scrollIntoView({ behavior: 'smooth' });
      closeDeck();
    });
  }

  if (navSoundboard) {
    navSoundboard.addEventListener('click', () => {
      const sb = document.getElementById('sound-search');
      if (sb) {
        sb.focus();
        sb.scrollIntoView({ behavior: 'smooth' });
      }
      closeDeck();
    });
  }

  const cardAutoDj = document.getElementById('deck-card-autodj');
  if (cardAutoDj) {
    cardAutoDj.addEventListener('click', () => {
      closeDeck();
      const b = document.getElementById('drop-target-box');
      if (b) b.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const cardSoundboard = document.getElementById('deck-card-soundboard');
  if (cardSoundboard) {
    cardSoundboard.addEventListener('click', () => {
      closeDeck();
      const s = document.getElementById('sound-search');
      if (s) {
        s.focus();
        s.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const cardZen = document.getElementById('deck-card-zen');
  if (cardZen) {
    cardZen.addEventListener('click', () => {
      closeDeck();
      openHolo();
    });
  }

  const cardSpaeti = document.getElementById('deck-card-spaeti');
  if (cardSpaeti) {
    cardSpaeti.addEventListener('click', () => {
      closeDeck();
      const f = document.getElementById('btn-emergency-pfeffi');
      if (f) f.click();
    });
  }

  function triggerPartyAction(name: string) {
    appendLog('PARTY_COMMAND', name, 'text-emerald-300');
    showToast('PARTY COMMAND AUSGEFÜHRT', name);
  }

  const pActions = [
    { id: 'holo-act-bass', cmd: 'BASSBOOST 150 BPM' },
    { id: 'holo-act-pfeffi', cmd: 'PFEFFI-INJEKTION' },
    { id: 'holo-act-spaeti', cmd: 'SPÄTI-ALARM' },
    { id: 'holo-act-fog', cmd: 'NEBELMASCHINE MAX' },
    { id: 'hub-quick-bass', cmd: 'BASSBOOST 150 BPM' },
    { id: 'hub-quick-pfeffi', cmd: 'PFEFFI-INJEKTION' },
    { id: 'hub-quick-fog', cmd: 'NEBELMASCHINE MAX' }
  ];

  pActions.forEach(a => {
    const b = document.getElementById(a.id);
    if (b) {
      b.addEventListener('click', () => {
        triggerPartyAction(a.cmd);
        closeHolo();
        closeDeck();
      });
    }
  });
}
