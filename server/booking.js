import fs from "fs";
import nodemailer from "nodemailer";

export function loadEnvFile(file) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

function clip(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

function clipLine(value, max = 200) {
  return clip(value, max).replace(/[\r\n]+/g, " ");
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 20000) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function limited(hits, ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export function createBookingHandler(env) {
  const user = clipLine(env.SMTP_USER);
  const pass = String(env.SMTP_PASS || "").replace(/\s+/g, "");
  const to = clipLine(env.SMTP_TO || user);
  const host = clipLine(env.SMTP_HOST || "smtp.gmail.com");
  const port = Number(env.SMTP_PORT || 465);
  const hits = new Map();
  const transporter = user && pass
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })
    : null;

  return function bookingHandler(req, res, next) {
    const url = (req.url || "").split("?")[0];
    if (url !== "/api/booking") {
      if (next) next();
      return;
    }
    if (req.method !== "POST") {
      send(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    if (!transporter) {
      send(res, 500, { ok: false, error: "Mail is not configured" });
      return;
    }
    const ip = req.socket?.remoteAddress || "local";
    if (limited(hits, ip)) {
      send(res, 429, { ok: false, error: "Too many requests" });
      return;
    }

    readBody(req)
      .then(async (raw) => {
        let data;
        try {
          data = JSON.parse(raw || "{}");
        } catch {
          data = null;
        }
        if (!data || typeof data !== "object") {
          send(res, 400, { ok: false, error: "Invalid booking" });
          return;
        }
        const booking = {
          name: clipLine(data.name),
          whatsapp: clipLine(data.whatsapp),
          email: clipLine(data.email),
          website: clipLine(data.website),
          date: clipLine(data.date, 40),
          time: clipLine(data.time, 40),
          note: clip(data.note, 2000),
          pipelineScore: clipLine(data.pipelineScore, 20),
          clientSource: clipLine(data.clientSource),
          callsLastMonth: clipLine(data.callsLastMonth),
          predictRevenue: clipLine(data.predictRevenue),
          salesBy: clipLine(data.salesBy),
          revenue: clipLine(data.revenue),
          canInvest: clipLine(data.canInvest),
        };
        if (!booking.name || !booking.whatsapp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) || !booking.date || !booking.time) {
          send(res, 400, { ok: false, error: "Missing booking details" });
          return;
        }
        const lines = [
          "New Pipeline Strategy Call booking",
          "",
          `Name: ${booking.name}`,
          `WhatsApp: ${booking.whatsapp}`,
          `Email: ${booking.email}`,
          `Website: ${booking.website || "—"}`,
          `When: ${booking.date} ${booking.time}`,
          `Pipeline score: ${booking.pipelineScore || "—"}`,
          "",
          "Answers",
          `Where clients come from: ${booking.clientSource || "—"}`,
          `Calls last month: ${booking.callsLastMonth || "—"}`,
          `Can predict revenue: ${booking.predictRevenue || "—"}`,
          `Who sells: ${booking.salesBy || "—"}`,
          `Monthly revenue: ${booking.revenue || "—"}`,
          `Ready to invest: ${booking.canInvest || "—"}`,
          "",
          "Note",
          booking.note || "—",
        ];
        await transporter.sendMail({
          from: `"Website booking" <${user}>`,
          to,
          replyTo: booking.email,
          subject: `Pipeline call: ${booking.name} — ${booking.date} ${booking.time}`,
          text: lines.join("\n"),
        });
        send(res, 200, { ok: true });
      })
      .catch((error) => {
        console.error("Booking email failed:", error && error.message ? error.message : error);
        if (!res.writableEnded) send(res, 502, { ok: false, error: "Could not send email" });
      });
  };
}

export function bookingApiPlugin(env) {
  const handler = createBookingHandler(env);
  return {
    name: "booking-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
