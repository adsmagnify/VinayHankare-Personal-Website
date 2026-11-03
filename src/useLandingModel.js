import { useEffect, useState } from "react";

function isThankYouPath() {
  return window.location.pathname.replace(/\/+$/, "") === "/thank-you";
}

export function useLandingModel(accent = "#D6EC1B") {
  const [state, setStateRaw] = useState(() => (isThankYouPath() ? { step: 8 } : {}));
  useEffect(() => {
    const onPop = () => setStateRaw((prev) => ({ ...prev, step: isThankYouPath() ? 8 : 1 }));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const setState = (patch) => {
    setStateRaw((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  };
  const self = { state, setState, props: { accent } };
  return compute(self);
}

function compute(self) {
    const s = self.state || {};
    const step = s.step == null ? 1 : Number(s.step);
    const ON = "font: inherit; font-size: 16px; text-align: left; padding: 14px 18px; min-height: 52px; border-radius: 12px; border: 2px solid #191B1D; background: #191B1D; color: #D6EC1B; font-weight: 700; cursor: pointer";
    const OFF = "font: inherit; font-size: 16px; text-align: left; padding: 14px 18px; min-height: 52px; border-radius: 12px; border: 2px solid #C9CCD1; background: #FFFFFF; color: #191B1D; font-weight: 500; cursor: pointer";
    const mk = (key, opts, next) => opts.map((o) => ({ label: o, style: s[key] === o ? ON : OFF, pick: () => self.setState({ [key]: o, step: next }) }));
    const L1 = ["Referrals and my network", "A mix of referrals and some marketing", "A system: ads or outbound, every month"];
    const L2 = ["0 to 2 calls", "3 to 9 calls", "10 or more calls"];
    const L3 = ["No, it changes every month", "Roughly", "Yes, quite accurately"];
    const L4 = ["Only me", "Me and one other person", "A sales person or team"];
    const L5 = ["Under ₹3L", "₹3L to ₹10L", "₹10L to ₹30L", "₹30L+"];
    const L6 = ["Yes, ready this month", "Yes, within 60 days", "Not right now"];
    const pts = (list, v) => Math.max(0, list.indexOf(v));
    const score = pts(L1, s.a1) + pts(L2, s.a2) + pts(L3, s.a3) + pts(L4, s.a4);
    const scoreMsg = score <= 3 ? "Your pipeline runs on luck. This is exactly what the system fixes." : (score <= 6 ? "You have some flow, but it isn’t predictable yet. A system makes it consistent." : "Strong pipeline. The system can scale what already works.");
    const fit = s.a5 && s.a5 !== "Under ₹3L" && s.a6 && s.a6 !== "Not right now";
    const fmt = (n) => {
      if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2).replace(/\.?0+$/, "") + " Cr";
      if (n >= 100000) return "₹" + (n / 100000).toFixed(2).replace(/\.?0+$/, "") + "L";
      return "₹" + Math.round(n / 1000) + "K";
    };
    const close = Number(s.close || 10);
    const ret = Number(s.ret || 50000);
    const clients = Math.round(50 * close / 100);
    const mrr = clients * ret;
    const months = mrr > 0 ? Math.ceil(283200 / mrr) : 0;
    const payback = mrr <= 0 ? "Move the sliders to see your numbers." : (months <= 1 ? "New retainers cover your full investment in the first month." : "New retainers cover your full investment in " + months + " months.");

    const BOOKING_ENDPOINT = "/api/booking";
    const SLOT_TIMES = [["11:00 AM","11:00"],["12:00 PM","12:00"],["2:00 PM","14:00"],["3:00 PM","15:00"],["4:00 PM","16:00"],["5:00 PM","17:00"]];
    const pad = (n) => (n < 10 ? "0" : "") + n;
    const today = new Date(); today.setHours(0,0,0,0);
    const lastDay = new Date(today); lastDay.setDate(lastDay.getDate() + 28);
    let startMo = 1;
    for (let t = new Date(today); t.getMonth() === today.getMonth(); t.setDate(t.getDate() + 1)) { if (t > today && t.getDay() !== 0 && t.getDay() !== 6) { startMo = 0; break; } }
    const maxMo = lastDay.getMonth() === today.getMonth() ? 0 : (lastDay.getFullYear() - today.getFullYear()) * 12 + lastDay.getMonth() - today.getMonth();
    const mo = s.mo == null ? startMo : Number(s.mo);
    const first = new Date(today.getFullYear(), today.getMonth() + mo, 1);
    const monthLabel = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const days = [];
    for (let i = 0; i < lead; i++) days.push({ label: "", aria: "", pressed: "false", style: "visibility: hidden; min-height: 40px", pick: () => {} });
    for (let n = 1; n <= dim; n++) {
      const d = new Date(first.getFullYear(), first.getMonth(), n);
      const wd = d.getDay();
      const ok = d > today && d <= lastDay && wd !== 0 && wd !== 6;
      const key = iso(d);
      const sel = s.selDate === key;
      days.push({
        label: String(n),
        aria: d.toDateString() + (ok ? "" : " unavailable"),
        pressed: sel ? "true" : "false",
        style: "font: inherit; font-size: 15px; min-height: 40px; border-radius: 10px; border: 0; " + (sel ? "background: #191B1D; color: #D6EC1B; font-weight: 800; cursor: pointer" : ok ? "background: #F4F5F6; color: #191B1D; font-weight: 700; cursor: pointer" : "background: transparent; color: #B8BCC2; cursor: not-allowed"),
        pick: () => { if (ok) self.setState({ selDate: key, selTime: null }); }
      });
    }
    const selD = s.selDate ? new Date(s.selDate + "T00:00:00") : null;
    const dateLabel = selD ? selD.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : "";
    const slots = SLOT_TIMES.map(([lab, hm]) => ({
      label: lab,
      style: "font: inherit; font-size: 15px; padding: 10px 8px; min-height: 44px; border-radius: 10px; cursor: pointer; font-weight: 700; " + (s.selTime === lab ? "border: 2px solid #191B1D; background: #191B1D; color: #D6EC1B" : "border: 2px solid #191B1D; background: #FFFFFF; color: #191B1D"),
      pick: () => self.setState({ selTime: lab, selHM: hm, book: "confirm" })
    }));
    const book = s.book || "cal";
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email || "");
    const startUtc = s.selDate && s.selHM ? new Date(s.selDate + "T" + s.selHM + ":00+05:30") : null;
    const g = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const gcalUrl = startUtc ? "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Pipeline Strategy Call with Vinay Hankare (Adsmagnify)") + "&dates=" + g(startUtc) + "/" + g(new Date(startUtc.getTime() + 45 * 60000)) + "&details=" + encodeURIComponent("Your free 45-minute Pipeline Strategy Call. The Google Meet link will arrive by email.") + "&location=" + encodeURIComponent("Google Meet") : "#check";
    const pct = Math.round((Math.min(step, 6) / 6) * 100);
    return {
      accent: self.props.accent ?? "#D6EC1B",
      name: s.name || "", phone: s.phone || "", site: s.site || "",
      onName: (e) => self.setState({ name: e.target.value }),
      onPhone: (e) => self.setState({ phone: e.target.value }),
      onSite: (e) => self.setState({ site: e.target.value }),
      showErr: !!s.err,
      start: () => { if (!s.name || !s.phone) { self.setState({ err: true }); return; } self.setState({ err: false, step: 1 }); },
      back: () => self.setState({ step: Math.max(1, step - 1) }),
      q0: false, inQuiz: step >= 1 && step <= 6, booking: step === 7, thankYou: step === 8,
      backToQuestions: () => self.setState({ step: 6 }),
      markBooked: () => {
        if (!isThankYouPath()) window.history.pushState({}, "", "/thank-you");
        self.setState({ step: 8 });
        window.scrollTo(0, 0);
      },
      restart: () => {
        if (window.location.pathname !== "/") window.history.pushState({}, "", "/");
        self.setState({ step: 1 });
        window.scrollTo(0, 0);
      },
      q1: step === 1, q2: step === 2, q3: step === 3, q4: step === 4, q5: step === 5, q6: step === 6,
      qNum: Math.min(step, 6), qPct: pct + "%",
      barStyle: "height: 100%; width: " + pct + "%; background: #191B1D; border-radius: 999px; transition: width .3s",
      o1: mk("a1", L1, 2), o2: mk("a2", L2, 3), o3: mk("a3", L3, 4), o4: mk("a4", L4, 5), o5: mk("a5", L5, 6),
      o6: L6.map((o) => ({ label: o, style: s.a6 === o ? ON : OFF, pick: () => { self.setState({ a6: o, step: 7 }); requestAnimationFrame(() => { const card = document.getElementById("check"); if (card) card.scrollIntoView({ behavior: "smooth", block: "start" }); }); } })),
      showResult: step === 7, score: score, scoreMsg: scoreMsg, fit: step === 7 && !!fit, noFit: step === 7 && !fit,
      days: days, monthLabel: monthLabel, dateLabel: dateLabel, slots: slots, hasDate: !!s.selDate, selTime: s.selTime || "",
      prevMonth: () => self.setState({ mo: Math.max(startMo, mo - 1) }),
      nextMonth: () => self.setState({ mo: Math.min(maxMo, mo + 1) }),
      calView: book === "cal", confirmView: book === "confirm", doneView: book === "done",
      email: s.email || "", onEmail: (e) => self.setState({ email: e.target.value, emailErr: false }),
      emailErr: !!s.emailErr, sendErr: !!s.sendErr, sending: !!s.sending, gcalUrl: gcalUrl, note: s.note || "", onNote: (e) => self.setState({ note: e.target.value }),
      changeTime: () => self.setState({ book: "cal" }),
      confirmBooking: () => {
        if (s.sending) return;
        if (!emailOk) { self.setState({ emailErr: true, sendErr: false }); return; }
        const booking = { type: "Pipeline Strategy Call", date: s.selDate, time: s.selTime + " IST", name: s.name || "", whatsapp: s.phone || "", email: s.email || "", website: s.site || "", note: s.note || "", pipelineScore: score + "/8", clientSource: s.a1 || "", callsLastMonth: s.a2 || "", predictRevenue: s.a3 || "", salesBy: s.a4 || "", revenue: s.a5 || "", canInvest: s.a6 || "" };
        self.setState({ sending: true, sendErr: false, emailErr: false });
        fetch(BOOKING_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(booking) })
          .then((res) => {
            if (!res.ok) throw new Error("send failed");
            self.setState({ sending: false, book: "done" });
          })
          .catch(() => self.setState({ sending: false, sendErr: true }));
      },
      firstName: (s.name || "").trim().split(" ")[0] || "there",
      close: close, ret: ret, closeLabel: close + "%", retLabel: fmt(ret),
      newClients: clients, mrr: fmt(mrr), payback: payback,
      onClose: (e) => self.setState({ close: e.target.value }),
      onRet: (e) => self.setState({ ret: e.target.value })
    };
  }
