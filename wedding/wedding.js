// Wedding site: language switching, registration form, attendee list.

// Paste the Google Apps Script web app URL here (see _wedding_backend/README.md).
// While empty, the site runs in demo mode and stores registrations only in this browser.
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
    "reg.intro": "Please register everyone who is coming. You can add several people at once.",
    "reg.family": "Family name",
    "reg.first": "First name",
    "reg.email": "Email (optional)",
    "reg.emailNote": "We'll send updates about the wedding to this address.",
    "reg.badEmail": "Please check the email addresses.",
    "reg.accom": "I will need help with accommodation",
    "reg.accomNote": "We'll do our best to help, but we can't promise we will be able to arrange accommodation for everyone.",
    "reg.add": "+ Add another person",
    "reg.remove": "Remove",
    "reg.submit": "Send registration",
    "reg.sending": "Sending…",
    "reg.ok": "Thank you! We've received your registration.",
    "reg.again": "Register more people",
    "reg.missing": "Please fill in both names for everyone.",
    "reg.error": "Something went wrong. Please try again, or contact us directly.",
    "att.title": "Guests",
    "att.count": "{n} people registered so far",
    "att.empty": "Nobody has registered yet — be the first!",
    "att.loading": "Loading…",
    "att.error": "Could not load the guest list.",
    demo: "Demo mode: no backend is connected yet, so registrations are only saved in this browser.",
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
    "reg.intro": "Kérjük, mindenkit regisztráljatok, aki jön. Egyszerre több személyt is megadhattok.",
    "reg.family": "Vezetéknév",
    "reg.first": "Keresztnév",
    "reg.email": "E-mail (nem kötelező)",
    "reg.emailNote": "Erre a címre küldjük majd az esküvővel kapcsolatos híreket.",
    "reg.badEmail": "Kérjük, ellenőrizd az e-mail-címeket.",
    "reg.accom": "Szükségem lesz segítségre a szállással",
    "reg.accomNote": "Igyekszünk segíteni, de nem tudjuk biztosan megígérni, hogy mindenkinek tudunk szállást szervezni.",
    "reg.add": "+ Újabb személy hozzáadása",
    "reg.remove": "Törlés",
    "reg.submit": "Regisztráció elküldése",
    "reg.sending": "Küldés…",
    "reg.ok": "Köszönjük! Megkaptuk a regisztrációt.",
    "reg.again": "További személyek regisztrálása",
    "reg.missing": "Kérjük, mindenkinél add meg mindkét nevet.",
    "reg.error": "Valami hiba történt. Kérjük, próbáld újra, vagy írj nekünk közvetlenül.",
    "att.title": "Vendégek",
    "att.count": "Eddig {n} fő regisztrált",
    "att.empty": "Még senki nem regisztrált — legyél te az első!",
    "att.loading": "Betöltés…",
    "att.error": "Nem sikerült betölteni a vendéglistát.",
    demo: "Demó mód: még nincs bekötve a háttérrendszer, ezért a regisztrációk csak ebben a böngészőben tárolódnak.",
  },
};

const DEMO_KEY = "wedding-demo-registrations";

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
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
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

// ---- Backend ----

function readDemo() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) || [];
  } catch (e) {
    return [];
  }
}

async function submitRegistration(people) {
  const payload = { people, lang };
  if (!ENDPOINT) {
    const group = Date.now().toString(36);
    const rows = readDemo().concat(people.map((p) => ({ ...p, group })));
    localStorage.setItem(DEMO_KEY, JSON.stringify(rows));
    return;
  }
  // text/plain avoids a CORS preflight, which Apps Script cannot answer.
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
}

// Returns [{ family, first, group }]. `group` links people registered together.
async function fetchAttendees() {
  if (!ENDPOINT) return readDemo().map(({ family, first, group }) => ({ family, first, group }));
  const res = await fetch(ENDPOINT);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Request failed");
  return data.attendees;
}

// ---- Registration page ----

function initRegistration() {
  const form = document.getElementById("register-form");
  if (!form) return;
  const list = document.getElementById("people");
  const template = document.getElementById("person-template");
  const status = document.getElementById("status");
  const submit = form.querySelector("button[type=submit]");
  const done = document.getElementById("done");

  function addPerson() {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".remove").addEventListener("click", () => {
      node.remove();
      updateRemoveButtons();
    });
    list.appendChild(node);
    applyLanguage();
    updateRemoveButtons();
    return node;
  }

  function updateRemoveButtons() {
    const rows = list.querySelectorAll(".person");
    rows.forEach((r) => (r.querySelector(".remove").hidden = rows.length === 1));
  }

  document.getElementById("add-person").addEventListener("click", () => {
    addPerson().querySelector("input").focus();
  });

  document.getElementById("again").addEventListener("click", () => {
    list.innerHTML = "";
    addPerson();
    done.hidden = true;
    form.hidden = false;
    status.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.website.value) return; // honeypot filled: likely a bot
    const people = [...list.querySelectorAll(".person")].map((row) => ({
      family: row.querySelector("[name=family]").value.trim(),
      first: row.querySelector("[name=first]").value.trim(),
      email: row.querySelector("[name=email]").value.trim(),
      accommodation: row.querySelector("[name=accommodation]").checked,
    }));
    if (people.some((p) => !p.family || !p.first)) {
      status.className = "status error";
      status.textContent = t("reg.missing");
      return;
    }
    if (people.some((p) => p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))) {
      status.className = "status error";
      status.textContent = t("reg.badEmail");
      return;
    }
    submit.disabled = true;
    submit.textContent = t("reg.sending");
    status.textContent = "";
    try {
      await submitRegistration(people);
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      console.error(err);
      status.className = "status error";
      status.textContent = t("reg.error");
    } finally {
      submit.disabled = false;
      submit.textContent = t("reg.submit");
    }
  });

  addPerson();
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
    const collator = new Intl.Collator("hu");
    const sorted = [...attendees].sort((a, b) => collator.compare(a.family, b.family) || collator.compare(a.first, b.first));
    for (const p of sorted) {
      const li = document.createElement("li");
      const fam = document.createElement("span");
      fam.className = "family";
      fam.textContent = p.family;
      // Hungarian puts the family name first; English the given name.
      if (lang === "hu") li.append(fam, " " + p.first);
      else li.append(p.first + " ", fam);
      list.appendChild(li);
    }
  }

  document.addEventListener("languagechange", render);
  render();
  fetchAttendees()
    .then((rows) => {
      attendees = rows;
      // Exposed for the future graph visualisation.
      window.weddingAttendees = rows;
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
    groom.textContent = toggle.checked ? "Mészi" : "Balázs";
  }
  try {
    toggle.checked = localStorage.getItem("wedding-groom") === "Mészi";
  } catch (e) {}
  toggle.addEventListener("change", () => {
    show();
    try {
      localStorage.setItem("wedding-groom", groom.textContent);
    } catch (e) {}
  });
  show();
}

// ---- Boot ----

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.addEventListener("click", () => setLanguage(b.dataset.lang));
  });
  const banner = document.getElementById("demo-banner");
  if (banner) banner.hidden = !!ENDPOINT;
  initNameSwitch();
  initRegistration();
  initAttendees();
  applyLanguage();
});
