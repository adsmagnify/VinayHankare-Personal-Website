import { useEffect, useRef } from "react";

const URL = "https://calendly.com/adsmagnify_com/book-a-60-min-call";
const SCRIPT = "https://assets.calendly.com/assets/external/widget.js";

function loadCalendly() {
  if (window.Calendly) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve) => {
      if (window.Calendly) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Calendly failed to load"));
    document.head.appendChild(script);
  });
}

export function CalEmbed({ onScheduled }) {
  const ref = useRef(null);
  const onScheduledRef = useRef(onScheduled);
  onScheduledRef.current = onScheduled;

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== "https://calendly.com") return;
      if (event.data && event.data.event === "calendly.event_scheduled") onScheduledRef.current?.();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCalendly()
      .then(() => {
        if (cancelled || !ref.current || !window.Calendly) return;
        ref.current.replaceChildren();
        window.Calendly.initInlineWidget({
          url: URL,
          parentElement: ref.current,
        });
        const frame = ref.current.querySelector("iframe");
        if (frame) {
          frame.style.width = "100%";
          frame.style.height = "700px";
          frame.style.minHeight = "700px";
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={ref} style={{ width: "100%", height: 700 }} />;
}
