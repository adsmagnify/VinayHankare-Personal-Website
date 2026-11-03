import { useEffect } from "react";
import { css } from "./css";

export function ThankYouPage({ accent = "#D6EC1B", onBack }) {
  useEffect(() => {
    const previous = document.title;
    document.title = "You’re booked | Vinay Hankare";
    if (typeof window.fbq === "function") {
      window.fbq("track", "Schedule");
      window.fbq("track", "Lead");
    }
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <div style={css("min-height: 100vh; font-family: 'DM Sans', 'Helvetica Neue', Helvetica, sans-serif; color: #FFFFFF; background: #191B1D; line-height: 1.55; font-size: 17px")}>
      <div style={css("padding: 10px 24px; font-size: 14px; border-bottom: 1px solid #2E3134")}>
        <div style={css("max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 16px")}>
          <a href="tel:+917700090236" style={css("color: #E4E6E8; text-decoration: none")}>
            {"+91 77000 90236"}
          </a>
          <span style={css(`font-weight: 700; color: ${accent}`)}>
            {"Only 2 agency slots remaining this month"}
          </span>
        </div>
      </div>
      <header style={css("border-bottom: 1px solid #2E3134")}>
        <div style={css("max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px")}>
          <button type="button" onClick={onBack} style={css("display: flex; align-items: center; gap: 12px; background: none; border: 0; padding: 0; color: #FFFFFF; cursor: pointer; font: inherit")}>
            <span style={css(`width: 40px; height: 40px; border-radius: 10px; background: ${accent}; color: #191B1D; display: inline-flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-weight: 800; font-size: 16px`)}>
              {"VH"}
            </span>
            <span style={css("display: flex; flex-direction: column; line-height: 1.1; text-align: left")}>
              <span style={css("font-family: 'Sora', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: 0.04em")}>
                {"VINAY HANKARE"}
              </span>
              <span style={css("font-size: 11px; letter-spacing: 0.2em; color: #B8BCC2")}>
                {"CLIENT ACQUISITION FOR AGENCIES"}
              </span>
            </span>
          </button>
        </div>
      </header>
      <main style={css("max-width: 720px; margin: 0 auto; padding: 88px 24px 120px; display: flex; flex-direction: column; align-items: flex-start; gap: 18px")}>
        <span style={css(`width: 64px; height: 64px; border-radius: 50%; background: ${accent}; display: flex; align-items: center; justify-content: center`)}>
          <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#191B1D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
        <span style={css(`background: ${accent}; color: #191B1D; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; padding: 5px 10px; border-radius: 6px`)}>
          {"THANK YOU"}
        </span>
        <h1 style={css("margin: 0; font-family: 'Sora', sans-serif; font-weight: 800; font-size: clamp(36px, 5vw, 56px); line-height: 1.05; letter-spacing: -0.03em")}>
          {"You’re booked."}
        </h1>
        <p style={css("margin: 0; font-size: 19px; color: #C9CDD2; max-width: 36em")}>
          {"Your 60-minute call with Vinay is confirmed. A calendar invitation is on its way to your email."}
        </p>
        <div style={css("display: flex; flex-direction: column; gap: 10px; margin-top: 8px")}>
          <span style={css("color: #E4E6E8")}>{"Check your inbox for the invite."}</span>
          <span style={css("color: #E4E6E8")}>{"Add it to your calendar so the time stays blocked."}</span>
          <span style={css("color: #E4E6E8")}>{"Vinay will meet you on that call."}</span>
        </div>
        <button type="button" onClick={onBack} style={css(`margin-top: 14px; background: ${accent}; color: #191B1D; border: 0; font: inherit; font-weight: 700; font-size: 17px; padding: 16px 24px; border-radius: 12px; min-height: 52px; cursor: pointer`)}>
          {"Back to the site"}
        </button>
      </main>
    </div>
  );
}
