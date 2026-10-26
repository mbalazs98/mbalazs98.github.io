// Wedding site: language switching, registration, "who do you know" network, attendee list.

// Google Apps Script web app URL (see _wedding_backend/README.md).
const ENDPOINT = "https://script.google.com/macros/s/AKfycbyudy_ESaTkKjL_dqsVk3X8iUeLjmLnkag-mH9gMlBGvLxEiC7ZXT34mFPkxkt3FFtX/exec";

const STRINGS = {
  en: {
    "nav.home": "Home",
    "nav.register": "Registration",
    "nav.attendees": "Guests",
    date: "5 June 2027",
    "home.when": "When",
    "home.whenText": "Saturday, 5 June 2027",
    "home.where": "Where",
    "home.whereText": "Gólya Presszó, Orczy út 46–48, 1089 Budapest, Hungary",
    "home.rsvp": "Please let us know if you can come.",
    "home.cta": "Register",
    "reg.title": "Registration",
    "reg.intro": "Please register each guest separately — afterwards you can tell us who you know.",
    "reg.family": "Family name",
    "reg.first": "First name",
    "reg.email": "Email (optional)",
    "reg.emailNote": "We'll send updates about the wedding to this address.",
    "reg.badEmail": "Please check the email address.",
    "reg.allergies": "Allergies or dietary requirements (optional)",
    "reg.accom": "I will need help with accommodation",
    "reg.accomNote": "We'll do our best to help, but we can't promise we will be able to arrange accommodation for everyone.",
    "reg.submit": "Send registration",
    "reg.sending": "Sending…",
    "reg.missing": "Please fill in both names.",
    "reg.error": "Something went wrong. Please try again, or contact us directly.",
    "reg.welcome": "Thank you, {name}! You're registered.",
    "reg.other": "Register someone else",
    "net.title": "Who do you know?",
    "net.intro": "Tick everyone on the guest list you already know. It helps us with the planning.",
    "net.search": "Search names…",
    "net.none": "Nobody else has registered yet — check back later!",
    "net.save": "Save",
    "net.saved": "Saved — thank you!",
    "net.error": "Could not save. Please try again.",
    "net.loadError": "Could not load the guest list.",
    "net.later": "More guests will keep registering, so come back to this page any time to tick new names.",
    "att.title": "Guests",
    "att.count": "{n} people registered so far",
    "att.empty": "Nobody has registered yet — be the first!",
    "att.loading": "Loading…",
    "att.error": "Could not load the guest list.",
  },
  hu: {
    "nav.home": "Főoldal",
    "nav.register": "Regisztráció",
    "nav.attendees": "Vendégek",
    date: "2027. június 5.",
    "home.when": "Mikor",
    "home.whenText": "2027. június 5., szombat",
    "home.where": "Hol",
    "home.whereText": "Gólya Presszó, 1089 Budapest, Orczy út 46–48.",
    "home.rsvp": "Kérjük, jelezzétek, ha el tudtok jönni.",
    "home.cta": "Regisztráció",
    "reg.title": "Regisztráció",
    "reg.intro": "Kérjük, mindenki külön regisztráljon — utána megjelölheted, kiket ismersz.",
    "reg.family": "Vezetéknév",
    "reg.first": "Keresztnév",
    "reg.email": "E-mail (nem kötelező)",
    "reg.emailNote": "Erre a címre küldjük majd az esküvővel kapcsolatos híreket.",
    "reg.badEmail": "Kérjük, ellenőrizd az e-mail-címet.",
    "reg.allergies": "Ételallergia vagy étkezési igény (nem kötelező)",
    "reg.accom": "Szükségem lesz segítségre a szállással",
    "reg.accomNote": "Igyekszünk segíteni, de nem tudjuk biztosan megígérni, hogy mindenkinek tudunk szállást szervezni.",
    "reg.submit": "Regisztráció elküldése",
    "reg.sending": "Küldés…",
    "reg.missing": "Kérjük, add meg mindkét nevet.",
    "reg.error": "Valami hiba történt. Kérjük, próbáld újra, vagy írj nekünk közvetlenül.",
    "reg.welcome": "Köszönjük, {name}! Sikeresen regisztráltál.",
    "reg.other": "Valaki más regisztrálása",
    "net.title": "Kiket ismersz?",
    "net.intro": "Jelöld be azokat a vendégeket, akiket már ismersz. Ez segít nekünk a szervezésben.",
    "net.search": "Keresés…",
    "net.none": "Még senki más nem regisztrált — nézz vissza később!",
    "net.save": "Mentés",
    "net.saved": "Elmentve — köszönjük!",
    "net.error": "Nem sikerült menteni. Kérjük, próbáld újra.",
    "net.loadError": "Nem sikerült betölteni a vendéglistát.",
    "net.later": "Folyamatosan érkeznek új regisztrációk, úgyhogy bármikor visszajöhetsz erre az oldalra, hogy új neveket jelölj be.",
    "att.title": "Vendégek",
    "att.count": "Eddig {n} fő regisztrált",
    "att.empty": "Még senki nem regisztrált — legyél te az első!",
    "att.loading": "Betöltés…",
    "att.error": "Nem sikerült betölteni a vendéglistát.",
  },
};

// The guest registered on this device: { id, token, family, first }.
const ME_KEY = "wedding-me";

let lang = pickLanguage();

function pickLanguage() {
  try {
    const saved = localStorage.getItem("wedding-lang");
    if (saved && STRINGS[saved]) return saved;
  } catch (e) {}
  return (navigator.language || "").toLowerCase().startsWith("hu") ? "hu" : "en";
}

function t(key, vars) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  for (const k in vars || {}) s = s.replace(`{${k}}`, vars[k]);
  return s;
}

function applyLanguage() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });
  document.dispatchEvent(new Event("languagechange"));
}

function setLanguage(next) {
  lang = next;
  try {
    localStorage.setItem("wedding-lang", next);
  } catch (e) {}
  applyLanguage();
}

// Hungarian puts the family name first; English the given name.
function fullName(p) {
  return lang === "hu" ? `${p.family} ${p.first}` : `${p.first} ${p.family}`;
}

const collator = new Intl.Collator("hu");

function byName(a, b) {
  return collator.compare(a.family, b.family) || collator.compare(a.first, b.first);
}

function loadMe() {
  try {
    return JSON.parse(localStorage.getItem(ME_KEY));
  } catch (e) {
    return null;
  }
}

function saveMe(me) {
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  } catch (e) {}
}

// ---- Backend ----

async function post(payload) {
  // text/plain avoids a CORS preflight, which Apps Script cannot answer.
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Returns { attendees: [{ id, family, first }], links: [{ source, target }] }.
async function fetchGuests() {
  const res = await fetch(ENDPOINT);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return { attendees: data.attendees, links: data.links || [] };
}

function setStatus(el, cls, text) {
  el.className = "status " + cls;
  el.textContent = text;
}

// ---- Registration page ----

function initRegistration() {
  const form = document.getElementById("register-form");
  if (!form) return;
  const stepRegister = document.getElementById("step-register");
  const stepNetwork = document.getElementById("step-network");
  const status = document.getElementById("status");
  const submit = form.querySelector("button[type=submit]");

  function showNetwork() {
    stepRegister.hidden = true;
    stepNetwork.hidden = false;
    document.dispatchEvent(new Event("networkshow"));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.website.value) return; // honeypot filled: likely a bot
    const person = {
      family: form.family.value.trim(),
      first: form.first.value.trim(),
      email: form.email.value.trim(),
      allergies: form.allergies.value.trim(),
      accommodation: form.accommodation.checked,
    };
    if (!person.family || !person.first) return setStatus(status, "error", t("reg.missing"));
    if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) return setStatus(status, "error", t("reg.badEmail"));
    submit.disabled = true;
    submit.textContent = t("reg.sending");
    status.textContent = "";
    try {
      const { id, token } = await post({ action: "register", person, lang });
      saveMe({ id, token, family: person.family, first: person.first });
      form.reset();
      showNetwork();
    } catch (err) {
      console.error(err);
      setStatus(status, "error", t("reg.error"));
    } finally {
      submit.disabled = false;
      submit.textContent = t("reg.submit");
    }
  });

  document.getElementById("register-other").addEventListener("click", () => {
    saveMe(null);
    stepNetwork.hidden = true;
    stepRegister.hidden = false;
    form.family.focus();
  });

  initNetwork();
  if (loadMe()) showNetwork();
}

function initNetwork() {
  const list = document.getElementById("net-list");
  const filter = document.getElementById("net-filter");
  const empty = document.getElementById("net-empty");
  const save = document.getElementById("net-save");
  const status = document.getElementById("net-status");
  const welcome = document.getElementById("welcome");
  let others = null;
  let failed = false;
  // Ticks survive re-renders (language switch, filtering).
  let ticked = new Set();

  function render() {
    const me = loadMe();
    if (!me) return;
    welcome.textContent = t("reg.welcome", { name: me.first });
    list.innerHTML = "";
    save.hidden = !others || !others.length;
    filter.hidden = save.hidden;
    empty.hidden = !save.hidden;
    if (failed) empty.textContent = t("net.loadError");
    else if (!others) empty.textContent = t("att.loading");
    else if (!others.length) empty.textContent = t("net.none");
    if (!others) return;
    const q = filter.value.trim().toLocaleLowerCase("hu");
    for (const p of others) {
      const name = fullName(p);
      const li = document.createElement("li");
      li.hidden = !!q && !name.toLocaleLowerCase("hu").includes(q);
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = ticked.has(p.id);
      box.addEventListener("change", () => {
        if (box.checked) ticked.add(p.id);
        else ticked.delete(p.id);
        status.textContent = "";
      });
      label.append(box, " " + name);
      li.appendChild(label);
      list.appendChild(li);
    }
  }

  async function load() {
    const me = loadMe();
    others = null;
    failed = false;
    status.textContent = "";
    filter.value = "";
    render();
    try {
      const { attendees, links } = await fetchGuests();
      others = attendees.filter((p) => p.id !== me.id).sort(byName);
      ticked = new Set(links.filter((l) => l.source === me.id).map((l) => l.target));
    } catch (err) {
      console.error(err);
      failed = true;
    }
    render();
  }

  save.addEventListener("click", async () => {
    const me = loadMe();
    save.disabled = true;
    try {
      await post({ action: "connect", id: me.id, token: me.token, knows: [...ticked] });
      setStatus(status, "ok", t("net.saved"));
    } catch (err) {
      console.error(err);
      setStatus(status, "error", t("net.error"));
    } finally {
      save.disabled = false;
    }
  });

  filter.addEventListener("input", render);
  document.addEventListener("languagechange", render);
  document.addEventListener("networkshow", load);
}

// ---- Attendees page ----

function initAttendees() {
  const list = document.getElementById("attendees");
  if (!list) return;
  const count = document.getElementById("count");
  let attendees = null;
  let failed = false;

  function render() {
    list.innerHTML = "";
    if (failed) {
      count.textContent = t("att.error");
      return;
    }
    if (!attendees) {
      count.textContent = t("att.loading");
      return;
    }
    count.textContent = attendees.length ? t("att.count", { n: attendees.length }) : t("att.empty");
    for (const p of [...attendees].sort(byName)) {
      const li = document.createElement("li");
      const fam = document.createElement("span");
      fam.className = "family";
      fam.textContent = p.family;
      if (lang === "hu") li.append(fam, " " + p.first);
      else li.append(p.first + " ", fam);
      list.appendChild(li);
    }
  }

  document.addEventListener("languagechange", render);
  render();
  fetchGuests()
    .then((data) => {
      attendees = data.attendees;
      // Exposed for the future graph visualisation.
      window.weddingGuests = data;
    })
    .catch((err) => {
      console.error(err);
      failed = true;
    })
    .finally(render);
}

// ---- Balázs / Mészi switch ----

function initNameSwitch() {
  const toggle = document.getElementById("name-toggle");
  const groom = document.querySelector(".groom");
  function show() {
    groom.classList.toggle("alt", toggle.checked);
  }
  try {
    toggle.checked = localStorage.getItem("wedding-groom") === "Mészi";
  } catch (e) {}
  toggle.addEventListener("change", () => {
    show();
    try {
      localStorage.setItem("wedding-groom", toggle.checked ? "Mészi" : "Balázs");
    } catch (e) {}
  });
  show();
}

// ---- Boot ----

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.addEventListener("click", () => setLanguage(b.dataset.lang));
  });
  initNameSwitch();
  initRegistration();
  initAttendees();
  applyLanguage();
});
