(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // Hours from the start of Friday, so return times compare with desk time.
  const hours = {
    "Fri 8 pm": 20,
    "Sat 9 am": 33,
    "Sat 10 am": 34,
    "Sat noon": 36,
  };
  const deskHours = [15.75, 19.5, 33];
  const returnTimes = Object.keys(hours);
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    checkin: 0,
    tagMsg: "",
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  let focusNext = "";
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const unitName = (id) => id + " · " + getAsset(id).type;
  const backAt = (l) => hours[l.expected || l.due];
  const overdue = (l) => !l.back && backAt(l) < deskHours[s.phase];
  // Accept "ad12", "AD 12" or "AD-12" as typed or scanned from a unit's label.
  const readTag = (raw) => {
    const t = String(raw || "")
      .toUpperCase()
      .replace(/\s+/g, "");
    const m = t.match(/^([A-Z]{2})-?(\d{1,2})$/);
    return m ? m[1] + "-" + m[2].padStart(2, "0") : t;
  };
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, selected) =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === selected ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        r.event +
        "</h3><p>" +
        r.club +
        " · Filed by " +
        r.owner +
        "</p><p><b>Return by</b> " +
        r.due +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p>" +
        r.note +
        "</p></div>";
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club,
            btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const l = out(a.id);
      const status = a.repair
        ? "In repair"
        : l
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · " +
          a.bin +
          (l ? " · L-" + l.num + " · With " + (l.holder || l.who) : ""),
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          returnTimes.map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html += checkinPanel() + handoverPrompts();
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    // Outstanding reads as "who is due at the counter next".
    if (s.onlyOpen) shown.sort((a, b) => backAt(a) - backAt(b));
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) html += loanRow(l);
    return html;
  }
  function loanRow(l) {
    const r = getReq(l.req);
    let detail = "";
    if (l.back && l.backBy)
      detail = "Returned by " + l.backBy + " · " + shifts[l.backPhase].time;
    else if (!l.back && l.holder)
      detail =
        "Now with " +
        l.holder +
        (overdue(l) ? " · Was expected " + l.expected : "") +
        (l.handover ? " · “" + l.handover + "”" : "");
    return (
      '<div class="row"><div><strong>' +
      esc("L-" + l.num + " · " + unitName(l.asset)) +
      "</strong><small>" +
      esc(
        r.id + " · " + r.club + " · Issued to " + l.who + " · Due " + l.due,
      ) +
      "</small>" +
      (detail
        ? '<small class="' +
          (l.back ? "" : "handover") +
          '">' +
          esc(detail) +
          "</small>"
        : "") +
      "</div><div>" +
      (l.back
        ? badge("Returned")
        : overdue(l)
          ? '<span class="tag warn">Overdue</span>'
          : l.holder
            ? badge("Expected " + l.expected)
            : badge("On loan")) +
      "</div></div>"
    );
  }
  // Returns are closed against the tag on the unit in hand, not a row button.
  function checkinPanel() {
    let html =
      '<form data-checkin class="checkin"><label><span>Check in a returned unit</span>' +
      '<input name="tag" required autocomplete="off" spellcheck="false" aria-describedby="checkin-help" /></label>' +
      '<button type="submit">Find slip</button>' +
      '<small id="checkin-help">Type or scan the tag on the unit in hand.</small></form>';
    if (s.tagMsg)
      html += '<p class="alert" role="alert">' + esc(s.tagMsg) + "</p>";
    const l = s.loans.find((x) => x.num === s.checkin && !x.back);
    if (!l) return html;
    const a = getAsset(l.asset),
      r = getReq(l.req);
    return (
      html +
      '<div class="record found"><small>' +
      esc("Slip L-" + l.num + " · " + r.id + " · " + r.club) +
      "</small><h3>" +
      esc(unitName(a.id)) +
      "</h3><p>" +
      esc(a.model + " · Shelve in " + a.bin) +
      "</p><p>" +
      esc("Issued to " + l.who + " · Due " + l.due) +
      "</p>" +
      (l.holder
        ? '<p class="handover">' +
          esc(
            "Handover: expected from " +
              l.holder +
              ", " +
              l.expected +
              (l.handover ? ". “" + l.handover + "”" : ""),
          ) +
          "</p>"
        : "") +
      '<form data-close class="buttons"><label>Returned by <select name="by">' +
      opts(
        people.map((p) => [p, p]),
        l.holder || l.who,
      ) +
      '</select></label><button type="submit" class="primary">Close slip L-' +
      l.num +
      "</button>" +
      btn("Cancel", "uncheck") +
      "</form></div>"
    );
  }
  // A part-returned request asks who has the rest, and keeps asking until the
  // answer is on the slips themselves.
  function handoverPrompts() {
    return requests
      .map((r) => {
        const mine = s.loans.filter((l) => l.req === r.id);
        const open = mine.filter((l) => !l.back);
        const todo = open.filter((l) => !l.holder);
        if (!todo.length || open.length === mine.length) return "";
        return (
          '<form data-handover data-req="' +
          r.id +
          '" class="record prompt"><small>' +
          esc(
            r.id +
              " · " +
              r.club +
              " · " +
              (mine.length - open.length) +
              " of " +
              mine.length +
              " units back",
          ) +
          "</small><h3>Who has the rest?</h3><fieldset><legend>Still out</legend>" +
          todo
            .map(
              (l) =>
                '<label class="check"><input type="checkbox" name="slip" value="' +
                l.num +
                '" checked /> ' +
                esc(
                  "L-" +
                    l.num +
                    " · " +
                    unitName(l.asset) +
                    " · Issued to " +
                    l.who +
                    " · Due " +
                    l.due,
                ) +
                "</label>",
            )
            .join("") +
          '</fieldset><div class="form"><label><span>Now with</span><select name="holder" required><option value="">Select…</option>' +
          opts(people.map((p) => [p, p])) +
          '</select></label><label><span>Back at the counter</span><select name="expected" required><option value="">Select…</option>' +
          opts(returnTimes.map((d) => [d, d])) +
          '</select></label><label class="full"><span>Note for the next shift (optional)</span><input name="note" maxlength="200" autocomplete="off" /></label></div>' +
          '<button type="submit">Save on slip</button></form>'
        );
      })
      .join("");
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    if (focusNext && q(focusNext)) q(focusNext).focus();
    focusNext = "";
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.tagMsg = "";
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "uncheck":
        s.checkin = 0;
        focusNext = "[data-checkin] input";
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-checkin]")) {
      const tag = readTag(form.get("tag"));
      const a = getAsset(tag);
      const l = a && out(a.id);
      s.checkin = l ? l.num : 0;
      s.tagMsg = "";
      focusNext = l ? '[data-close] [name="by"]' : "[data-checkin] input";
      if (!a)
        s.tagMsg =
          "No unit is tagged " +
          String(form.get("tag")).trim().toUpperCase() +
          ". Read the label on the unit again.";
      else if (!l) {
        const sameType = s.loans.filter(
          (x) => !x.back && getAsset(x.asset).type === a.type,
        );
        s.tagMsg =
          a.id +
          " (" +
          a.model +
          ") " +
          (a.repair ? "is booked into the workshop" : "is not on loan") +
          ", so there is no slip to close." +
          (sameType.length
            ? " Open " +
              a.type +
              " slips: " +
              sameType
                .map(
                  (x) =>
                    "L-" +
                    x.num +
                    " for " +
                    x.asset +
                    " (" +
                    getAsset(x.asset).model +
                    "), " +
                    (x.holder ? "now with " + x.holder : "issued to " + x.who),
                )
                .join("; ") +
              ". Check the tag on the unit in hand."
            : "");
      }
      commit();
      return;
    }
    if (f.matches("[data-close]")) {
      const l = s.loans.find((x) => x.num === s.checkin && !x.back);
      const by = form.get("by");
      if (!l || !people.includes(by)) return;
      Object.assign(l, { back: true, backBy: by, backPhase: s.phase });
      s.checkin = 0;
      focusNext = "[data-checkin] input";
      commit(
        l.asset +
          " checked in from " +
          by +
          ". Slip L-" +
          l.num +
          " closed. Shelve it in " +
          getAsset(l.asset).bin +
          ".",
      );
      return;
    }
    if (f.matches("[data-handover]")) {
      const r = getReq(f.dataset.req);
      const slips = form
        .getAll("slip")
        .map((n) => s.loans.find((l) => l.num === Number(n) && !l.back))
        .filter(Boolean);
      const holder = form.get("holder"),
        expected = form.get("expected"),
        note = String(form.get("note")).trim();
      if (!slips.length) {
        q("[data-status]").textContent =
          "Tick at least one unit that is still out.";
        return;
      }
      if (!r || !people.includes(holder) || !hours[expected]) return;
      for (const l of slips)
        Object.assign(l, { holder, expected, handover: note });
      s.notes.push({
        phase: s.phase,
        text:
          slips.map((l) => unitName(l.asset)).join(", ") +
          " (" +
          r.club +
          ") is with " +
          holder +
          ". Back at the counter " +
          expected +
          "." +
          (note ? " " + note : ""),
      });
      focusNext = "[data-checkin] input";
      commit(
        "Handover saved on " +
          slips.map((l) => "L-" + l.num).join(", ") +
          ": with " +
          holder +
          ", back " +
          expected +
          ".",
      );
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          hours[l.due] &&
          (!l.holder || (people.includes(l.holder) && hours[l.expected])) &&
          (!l.backBy || (people.includes(l.backBy) && shifts[l.backPhase])),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      checkin: 0,
      tagMsg: "",
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
