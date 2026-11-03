import { useEffect, useRef } from "react";

const SCRIPT = "https://app.cal.com/embed/embed.js";
const LINK = "vinay-hankare-sczu9l/growth-meeting";

function installCal() {
  const C = window;
  if (C.Cal && C.Cal.loaded) return;
  const p = (a, ar) => {
    a.q.push(ar);
  };
  const d = C.document;
  C.Cal = C.Cal || function calQueue() {
    const cal = C.Cal;
    const ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const script = d.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      d.head.appendChild(script);
      cal.loaded = true;
    }
    if (ar[0] === "init") {
      const api = function namespaceQueue() {
        p(api, arguments);
      };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === "string") {
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ["initNamespace", namespace]);
      } else {
        p(cal, ar);
      }
      return;
    }
    p(cal, ar);
  };
}

export function CalEmbed({ onScheduled }) {
  const ref = useRef(null);
  const onScheduledRef = useRef(onScheduled);
  onScheduledRef.current = onScheduled;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    installCal();
    window.Cal("init", "booking", { origin: "https://cal.com" });
    window.Cal.ns.booking("inline", {
      elementOrSelector: el,
      calLink: LINK,
      config: { layout: "month_view", theme: "light" },
    });
    window.Cal.ns.booking("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    window.Cal.ns.booking("on", {
      action: "bookingSuccessful",
      callback: () => onScheduledRef.current?.(),
    });
  }, []);

  return <div ref={ref} style={{ width: "100%", minHeight: 680 }} />;
}
