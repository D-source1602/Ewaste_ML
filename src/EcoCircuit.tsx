import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Page = "home" | "submit" | "results" | "track" | "impact" | "business" | "about" | "login";
type DeviceType = "Phone" | "Laptop" | "Tablet" | "TV" | "AC";
type PasswordRule = { id: string; label: string; test: (v: string) => boolean };
type EvaluatedRule = PasswordRule & { met: boolean };

// ─── PASSWORD STRENGTH HOOK ───────────────────────────────────────────────────
const COMMON = /^(?:password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|123456)/i;
const RUN = /(.)\1{3,}/;
const RUN_UP = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|erty|asdf)/i;
const SYMBOL = /[!-/:-@[-`{-~]/;

const defaultPasswordRules: readonly PasswordRule[] = [
  { id: "length", label: "12 characters or more", test: (v) => v.length >= 12 },
  { id: "case", label: "Upper and lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "digit", label: "A number", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "A symbol", test: (v) => SYMBOL.test(v) },
];

function usePasswordStrength(value: string) {
  return useMemo(() => {
    const evaluated: EvaluatedRule[] = defaultPasswordRules.map((r) => ({ ...r, met: r.test(value) }));
    const passed = evaluated.filter((r) => r.met).length;
    const guessable = value.length > 0 && (COMMON.test(value) || RUN.test(value) || RUN_UP.test(value));
    const score = value.length === 0 ? 0 : guessable ? 1 : Math.min(4, Math.max(1, passed));
    const labels = ["Empty", "Weak", "Fair", "Good", "Strong"];
    return { score, max: 4, label: labels[score], rules: evaluated, guessable };
  }, [value]);
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #030712;
    --bg1:      #0a0f1e;
    --bg2:      #0f1629;
    --surface:  #111827;
    --surface2: #1a2235;
    --border:   rgba(255,255,255,0.08);
    --border2:  rgba(255,255,255,0.14);
    --green:    #22c55e;
    --green-d:  #16a34a;
    --green-gl: rgba(34,197,94,0.15);
    --green-gl2:rgba(34,197,94,0.25);
    --teal:     #14b8a6;
    --blue:     #3b82f6;
    --amber:    #f59e0b;
    --red:      #ef4444;
    --text:     #f9fafb;
    --text2:    #9ca3af;
    --text3:    #6b7280;
    --radius:   10px;
    --radius-lg:16px;
    --radius-xl:24px;
    --mono:     'Space Grotesk', monospace;
    --sans:     'Inter', sans-serif;
    --shadow-green: 0 0 40px rgba(34,197,94,0.12);
    --shadow-card:  0 4px 24px rgba(0,0,0,0.4);
  }

  html, body, #root { min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--sans); }

  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--surface2); border-radius: 3px; }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes glow-pulse { 0%,100%{opacity:.5;transform:scale(1);} 50%{opacity:.8;transform:scale(1.08);} }
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes count-up  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ripple    { 0%{ transform:translate(-50%,-50%) scale(0);opacity:.6; } 100%{ transform:translate(-50%,-50%) scale(4);opacity:0; } }
  @keyframes shimmer   { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
  @keyframes slide-in  { from{transform:translateX(-100%);opacity:0;} to{transform:translateX(0);opacity:1;} }
  @keyframes bar-grow  { from{width:0;} to{width:var(--w);} }
  @keyframes float     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }

  .fade-up   { animation: fadeUp   .55s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-up-2 { animation: fadeUp   .55s cubic-bezier(.22,.68,0,1.2) .12s both; }
  .fade-up-3 { animation: fadeUp   .55s cubic-bezier(.22,.68,0,1.2) .24s both; }
  .fade-in   { animation: fadeIn   .4s ease both; }

  /* ── NAV ── */
  .nav {
    position:fixed; top:0; left:0; right:0; z-index:100;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 32px; height:60px;
    background:rgba(3,7,18,0.85); backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
  }
  .nav-logo { font-family:var(--mono); font-weight:700; font-size:18px; color:var(--green); letter-spacing:-.02em; cursor:pointer; display:flex; align-items:center; gap:8px; }
  .nav-logo svg { width:22px; height:22px; }
  .nav-links { display:flex; align-items:center; gap:4px; }
  .nav-link { background:none; border:none; padding:6px 14px; border-radius:8px; color:var(--text2); font-size:13.5px; font-family:var(--sans); cursor:pointer; transition:all .18s; }
  .nav-link:hover { color:var(--text); background:rgba(255,255,255,.06); }
  .nav-link.active { color:var(--green); }
  .nav-actions { display:flex; align-items:center; gap:8px; }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; border:none; border-radius:var(--radius); font-family:var(--sans); font-weight:500; cursor:pointer; transition:all .2s; white-space:nowrap; }
  .btn-primary { background:var(--green); color:#000; font-size:14px; padding:10px 22px; box-shadow:0 0 20px rgba(34,197,94,.3); }
  .btn-primary:hover { background:#16a34a; box-shadow:0 0 30px rgba(34,197,94,.45); transform:translateY(-1px); }
  .btn-primary:active { transform:translateY(0); }
  .btn-ghost { background:transparent; color:var(--text2); font-size:13.5px; padding:9px 18px; border:1px solid var(--border2); }
  .btn-ghost:hover { border-color:var(--green); color:var(--text); }
  .btn-sm { font-size:12.5px; padding:7px 14px; }
  .btn-lg { font-size:15px; padding:13px 30px; border-radius:12px; }
  .btn-danger { background:rgba(239,68,68,.15); color:var(--red); border:1px solid rgba(239,68,68,.2); font-size:13px; padding:8px 16px; }
  .btn-danger:hover { background:rgba(239,68,68,.25); }

  /* Liquid-metal inspired CTA */
  .btn-metal {
    position:relative; overflow:hidden;
    background:linear-gradient(180deg,#1a1a1a 0%,#000 100%);
    color:#aaa; font-size:15px; padding:13px 34px;
    border:1px solid rgba(255,255,255,.1); border-radius:100px;
    box-shadow:0 0 0 1px rgba(0,0,0,.3), 0 9px 9px rgba(0,0,0,.12), 0 4px 4px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.2);
    transition:all .35s cubic-bezier(.34,1.56,.64,1);
  }
  .btn-metal::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(255,255,255,.08) 0%,rgba(34,197,94,.12) 50%,rgba(255,255,255,.05) 100%);
    background-size:200% 200%; animation:shimmer 3s ease infinite;
  }
  .btn-metal:hover { box-shadow:0 0 0 1px rgba(34,197,94,.3),0 12px 6px rgba(0,0,0,.05),0 8px 5px rgba(0,0,0,.1),0 0 40px rgba(34,197,94,.15); transform:translateY(-2px) scale(1.02); color:#ccc; }
  .btn-metal:active { transform:translateY(0) scale(.98); }
  .btn-metal .ripple { position:absolute; border-radius:50%; background:radial-gradient(circle,rgba(34,197,94,.4) 0%,rgba(34,197,94,0) 70%); width:20px; height:20px; pointer-events:none; animation:ripple .6s ease-out; }

  /* ── CARDS ── */
  .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); }
  .card-hover { transition:all .2s; }
  .card-hover:hover { border-color:var(--border2); box-shadow:var(--shadow-card); transform:translateY(-2px); }
  .card-green { border-color:rgba(34,197,94,.2); background:linear-gradient(135deg,rgba(34,197,94,.04),rgba(20,184,166,.02)); }

  /* ── BADGES ── */
  .badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
  .badge-green { background:var(--green-gl); color:var(--green); border:1px solid rgba(34,197,94,.25); }
  .badge-amber { background:rgba(245,158,11,.12); color:var(--amber); border:1px solid rgba(245,158,11,.25); }
  .badge-red   { background:rgba(239,68,68,.12); color:var(--red); border:1px solid rgba(239,68,68,.25); }
  .badge-blue  { background:rgba(59,130,246,.12); color:var(--blue); border:1px solid rgba(59,130,246,.25); }

  /* ── INPUTS ── */
  .input { width:100%; background:var(--bg2); border:1px solid var(--border2); border-radius:var(--radius); color:var(--text); font-family:var(--sans); font-size:14px; padding:11px 14px; outline:none; transition:border .18s; }
  .input:focus { border-color:var(--green); box-shadow:0 0 0 3px rgba(34,197,94,.1); }
  .input::placeholder { color:var(--text3); }
  .input-label { font-size:12.5px; font-weight:500; color:var(--text2); margin-bottom:6px; display:block; }
  .input-group { display:flex; flex-direction:column; gap:0; }

  /* ── LAYOUT ── */
  .page { padding-top:60px; min-height:100vh; }
  .container { max-width:1100px; margin:0 auto; padding:0 24px; }
  .section { padding:80px 0; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }

  /* ── HERO GLOW ── */
  .hero-glow {
    position:absolute; top:-180px; left:50%; transform:translateX(-50%);
    width:700px; height:500px;
    background:radial-gradient(ellipse at 50% 30%, rgba(34,197,94,.18) 0%, transparent 65%);
    pointer-events:none; animation:glow-pulse 6s ease-in-out infinite;
  }

  /* ── STAT CARDS ── */
  .stat-card { padding:24px; }
  .stat-num { font-family:var(--mono); font-size:32px; font-weight:700; color:var(--green); line-height:1; }
  .stat-label { font-size:12.5px; color:var(--text2); margin-top:6px; }

  /* ── STEP WIZARD ── */
  .step-bar { display:flex; align-items:center; gap:0; margin-bottom:36px; }
  .step-item { display:flex; align-items:center; gap:0; flex:1; }
  .step-dot { width:32px; height:32px; border-radius:50%; border:2px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; transition:all .3s; }
  .step-dot.done { background:var(--green); border-color:var(--green); color:#000; }
  .step-dot.active { border-color:var(--green); color:var(--green); box-shadow:0 0 0 4px rgba(34,197,94,.15); }
  .step-line { flex:1; height:1px; background:var(--border); margin:0 8px; }
  .step-line.done { background:var(--green); }
  .step-label { font-size:11px; color:var(--text3); margin-top:6px; white-space:nowrap; }

  /* ── PARTNER CARDS ── */
  .partner-card { padding:18px; display:flex; flex-direction:column; gap:10px; cursor:pointer; transition:all .2s; }
  .partner-card:hover { border-color:var(--green); box-shadow:var(--shadow-green); }
  .partner-card.selected { border-color:var(--green); background:var(--green-gl); }
  .stars { color:var(--amber); font-size:13px; letter-spacing:1px; }

  /* ── STATUS STEPPER ── */
  .status-stepper { display:flex; align-items:flex-start; gap:0; }
  .status-step { flex:1; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .status-icon { width:40px; height:40px; border-radius:50%; border:2px solid var(--border2); display:flex; align-items:center; justify-content:center; font-size:16px; transition:all .3s; }
  .status-icon.done { background:var(--green-gl); border-color:var(--green); }
  .status-icon.active { border-color:var(--green); box-shadow:0 0 0 6px rgba(34,197,94,.12); animation:glow-pulse 2s infinite; }
  .status-connector { flex:1; height:2px; background:var(--border); margin-top:18px; }
  .status-connector.done { background:var(--green); }

  /* ── CHART BARS ── */
  .chart-bar { height:6px; border-radius:3px; background:var(--green); animation:bar-grow 1s ease; }

  /* ── TABLE ── */
  .table { width:100%; border-collapse:collapse; font-size:13px; }
  .table th { text-align:left; padding:10px 16px; color:var(--text2); font-weight:500; border-bottom:1px solid var(--border); font-size:11.5px; text-transform:uppercase; letter-spacing:.06em; }
  .table td { padding:12px 16px; border-bottom:1px solid var(--border); color:var(--text); }
  .table tr:last-child td { border-bottom:none; }
  .table tr:hover td { background:rgba(255,255,255,.02); }

  /* ── DROPDOWN ── */
  .select { width:100%; background:var(--bg2); border:1px solid var(--border2); border-radius:var(--radius); color:var(--text); font-size:14px; padding:10px 14px; outline:none; cursor:pointer; appearance:none; }
  .select:focus { border-color:var(--green); }

  /* ── RANGE ── */
  .range { width:100%; accent-color:var(--green); }

  /* ── DRAG ZONE ── */
  .drag-zone { border:2px dashed var(--border2); border-radius:var(--radius-lg); padding:40px; text-align:center; transition:all .2s; cursor:pointer; }
  .drag-zone:hover, .drag-zone.over { border-color:var(--green); background:var(--green-gl); }

  /* ── FEED ITEMS ── */
  .feed-item { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border); }
  .feed-dot { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; box-shadow:0 0 8px rgba(34,197,94,.5); }

  /* ── MOBILE NAV DRAWER ── */
  .mobile-menu { position:fixed; inset:0; z-index:200; background:rgba(3,7,18,.95); padding:80px 24px 40px; display:flex; flex-direction:column; gap:8px; animation:fadeIn .25s; }

  /* ── SCROLLING TEXT ── */
  .ticker-wrap { overflow:hidden; border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:12px 0; }
  .ticker { display:flex; gap:48px; animation:slide-in 0s; white-space:nowrap; }

  /* ── RESPONSIVE ── */
  @media (max-width:768px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns:1fr; }
    .nav-links, .nav-actions { display:none; }
    .hero-glow { width:300px; }
    .section { padding:48px 0; }
    .stat-num { font-size:24px; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const icons: Record<string, string> = {
    leaf: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    upload: "M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5z",
    chart: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    map: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    world: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    building: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
    info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    arrow: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
    truck: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    qr: "M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-4 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm6 0h-2v2h2v-2zm-2 2h-2v2h2v-2zm-4 0h-2v2h2v-2zm6 2h-2v2h2v-2zm-4 0h-2v2h2v-2z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    laptop: "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z",
    ac: "M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22v-2z",
    tv: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
    tablet: "M18 0H6C4.34 0 3 1.34 3 3v18c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zm-4 22h-4v-1h4v1zm5.25-3H4.75V3h14.5v16z",
    camera: "M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m5-3.5V5h-2V3.5c0-.83-.67-1.5-1.5-1.5h-7c-.83 0-1.5.67-1.5 1.5V5H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-4V3.5z",
    star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
    eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
    lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
    download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    trending: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z",
    recycle: "M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0-4C8.69 2 6 4.69 6 8c0 4.5 6 11 6 11s6-6.5 6-11c0-3.31-2.69-6-6-6z",
    cpu: "M9 9h6v6H9V9m-2 2H5v2h2v-2m10 0h-2v2h2v-2M9 5v2h2V5H9m2 14v-2H9v2h2m7-8h2V9h-2v2M5 9H3v2h2V9m4 10h2v-2H9v2M15 5v2h2V5h-2z",
    sparkle: "M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z",
    user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    coin: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  };
  const d = icons[name] || icons.leaf;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || "currentColor"} style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function MetalButton({ label, onClick }: { label: string; onClick?: () => void }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const ref = useRef<HTMLButtonElement>(null);
  const rid = useRef(0);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      const rip = { x: e.clientX - r.left, y: e.clientY - r.top, id: rid.current++ };
      setRipples((p) => [...p, rip]);
      setTimeout(() => setRipples((p) => p.filter((x) => x.id !== rip.id)), 600);
    }
    onClick?.();
  };
  return (
    <button ref={ref} className="btn btn-metal btn-lg" onClick={handleClick} style={{ position: "relative", overflow: "hidden" }}>
      <Icon name="sparkle" size={15} />
      {label}
      {ripples.map((r) => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y, transform: "translate(-50%,-50%)" }} />
      ))}
    </button>
  );
}

function CountUp({ to, suffix = "", duration = 2000 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { requestAnimationFrame(step); obs.disconnect(); } });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function PasswordStrengthBar({ value }: { value: string }) {
  const { score, max, label, rules, guessable } = usePasswordStrength(value);
  const colors = ["", "bg-red", "bg-amber", "bg-blue", "bg-green"] as const;
  const textColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {Array.from({ length: max }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--bg2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: i < score ? "100%" : "0", background: textColors[score], borderRadius: 2, transition: "width .3s" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: textColors[score] || "var(--text3)" }}>
        <span>{value.length > 0 ? label : "Enter a password"}</span>
        {guessable && <span style={{ color: "#f59e0b" }}>Commonly guessed</span>}
      </div>
      {value.length > 0 && (
        <ul style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {rules.map((r) => (
            <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: "1.5px solid", borderColor: r.met ? "#22c55e" : "var(--border2)", background: r.met ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
                {r.met && <Icon name="check" size={9} color="#000" />}
              </div>
              <span style={{ color: r.met ? "var(--text)" : "var(--text3)" }}>{r.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── PAGES ───────────────────────────────────────────────────────────────────

// ── LOGIN PAGE ──
function LoginPage({ onLogin, onNavigate }: { onLogin: () => void; onNavigate: (p: Page) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div className="hero-glow" style={{ top: -100, opacity: 0.7 }} />
      <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, background: "radial-gradient(ellipse at 50% 50%, rgba(20,184,166,.1) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div className="card fade-up" style={{ width: "100%", maxWidth: 420, padding: "36px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, background: "var(--green-gl)", border: "1.5px solid rgba(34,197,94,.3)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="recycle" color="var(--green)" size={20} />
            </div>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 18, color: "var(--green)" }}>EcoCircuit</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p style={{ color: "var(--text2)", fontSize: 13.5 }}>{mode === "login" ? "Sign in to your EcoCircuit account" : "Start routing your e-waste smarter"}</p>
        </div>

        <div style={{ display: "flex", gap: 0, background: "var(--bg2)", borderRadius: "var(--radius)", padding: 3, marginBottom: 24 }}>
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === m ? "var(--surface)" : "transparent", color: mode === m ? "var(--text)" : "var(--text2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .2s" }}>
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input type={show ? "text" : "password"} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" style={{ paddingRight: 42 }} />
              <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}>
                <Icon name="eye" size={16} />
              </button>
            </div>
            {mode === "signup" && <PasswordStrengthBar value={password} />}
          </div>
          {mode === "signup" && (
            <div className="input-group">
              <label className="input-label">Account type</label>
              <select className="select">
                <option>Individual — personal device recycling</option>
                <option>Business — EPR compliance tracking</option>
              </select>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 24, padding: "13px 0", fontSize: 14.5, justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
          {loading ? <span style={{ width: 18, height: 18, border: "2.5px solid #000", borderTopColor: "transparent", borderRadius: "50%", display: "block", animation: "spin 1s linear infinite" }} /> : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--text3)", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", gap: 10 }} onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); onLogin(); }, 900); }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continue with Google
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text3)", marginTop: 20 }}>
          By continuing, you agree to EcoCircuit's{" "}
          <a href="#" style={{ color: "var(--green)" }}>Terms of Service</a>
        </p>
      </div>
    </div>
  );
}

// ── HOME PAGE ──
function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = [
    { num: 1397000, label: "MT E-waste India FY25", suffix: "" },
    { num: 3, label: "Globally ranked 3rd", suffix: "rd" },
    { num: 30, label: "% informal recycling", suffix: "%" },
    { num: 70, label: "% EPR target FY26", suffix: "%" },
  ];
  const features = [
    { icon: "camera", title: "AI Condition Detection", desc: "CLIP reads device state from a single photo — no manual grading needed." },
    { icon: "cpu", title: "Value Prediction", desc: "Random Forest regression estimates resale, refurb, and material value in seconds." },
    { icon: "trending", title: "Smart Pathway Routing", desc: "Deterministic scoring rules match each device to its highest-value disposal path." },
    { icon: "building", title: "EPR Compliance", desc: "Auto-generate CPCB-ready reports for your e-waste obligations under EPR Rules 2022." },
    { icon: "truck", title: "Partner Matching", desc: "Top 3 certified recyclers, refurbishers, and NGOs matched by city and rating." },
    { icon: "qr", title: "QR Track & Trace", desc: "Every device gets a public QR status page from submission to processed." },
  ];
  const partners = ["Attero", "Karo Sambhav", "Namo eWaste", "Cerebra Green", "RecycleKaro"];

  return (
    <div className="page">
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 0 80px", textAlign: "center" }}>
        <div className="hero-glow" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="fade-in" style={{ marginBottom: 16 }}>
            <span className="badge badge-green" style={{ fontSize: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glow-pulse 2s infinite" }} />
              Live Impact Tracking · FY 2025–26
            </span>
          </div>
          <h1 className="fade-up" style={{ fontFamily: "var(--mono)", fontSize: "clamp(36px,6vw,68px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.03em", marginBottom: 20, background: "linear-gradient(135deg,#fff 0%,rgba(255,255,255,.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Route India's e-waste<br />through its best path.
          </h1>
          <p className="fade-up-2" style={{ fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Submit a device, get instant valuation via AI, and match with certified partners — all in 60 seconds.
          </p>
          <div className="fade-up-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <MetalButton label="Submit a Device" onClick={() => onNavigate("submit")} />
            <button className="btn btn-ghost btn-lg" onClick={() => onNavigate("business")}>
              For Business <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* LIVE STATS TICKER */}
      <div className="ticker-wrap">
        <div style={{ display: "flex", gap: 48, padding: "0 24px", overflowX: "hidden", whiteSpace: "nowrap" }}>
          {[...Array(3)].map((_, bi) =>
            ["13.97L MT e-waste FY25", "3rd largest globally", "322 certified recyclers", "30% informal sector", "EPR 70% target FY26", "60s device valuation"].map((t, i) => (
              <span key={`${bi}-${i}`} style={{ fontSize: 12.5, color: "var(--text3)", flexShrink: 0 }}>
                <span style={{ color: "var(--green)", marginRight: 8 }}>◆</span>{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* STATS GRID */}
      <section className="section" style={{ paddingTop: 60 }}>
        <div className="container">
          <div className="grid-4">
            {stats.map((s, i) => (
              <div key={i} className="card stat-card card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-num">
                  <CountUp to={s.num} suffix={s.suffix} />
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" style={{ background: "var(--bg1)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="badge badge-blue" style={{ marginBottom: 12 }}>How it works</span>
            <h2 style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, letterSpacing: "-.02em" }}>Three steps. 60 seconds.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, position: "relative" }}>
            {[
              { step: "01", icon: "upload", title: "Submit your device", desc: "Choose type, fill details, drop a photo. CLIP reads condition automatically — no grading form needed." },
              { step: "02", icon: "cpu", title: "AI reads and predicts", desc: "CLIP detects condition. Random Forest estimates resale, refurb viability, and material value simultaneously." },
              { step: "03", icon: "truck", title: "Match and dispatch", desc: "The highest-value pathway is selected by deterministic scoring. Top 3 partners shown. Request pickup in one tap." },
            ].map((step, i) => (
              <div key={i} className="card" style={{ padding: "28px 24px", borderRadius: i === 0 ? "var(--radius-lg) 0 0 var(--radius-lg)" : i === 2 ? "0 var(--radius-lg) var(--radius-lg) 0" : 0, borderLeft: i > 0 ? "none" : undefined, position: "relative" }}>
                {i < 2 && <div style={{ position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}><Icon name="arrow" size={13} color="var(--green)" /></div>}
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)", marginBottom: 12, letterSpacing: ".1em" }}>{step.step}</div>
                <div style={{ width: 40, height: 40, background: "var(--green-gl)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon name={step.icon} color="var(--green)" size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="badge badge-green" style={{ marginBottom: 12 }}>Platform features</span>
            <h2 style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, letterSpacing: "-.02em" }}>Built for India's e-waste reality</h2>
          </div>
          <div className="grid-3" style={{ gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="card card-hover" style={{ padding: "20px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, background: "var(--green-gl)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={f.icon} color="var(--green)" size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{f.title}</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITIVE EDGE */}
      <section className="section" style={{ background: "var(--bg1)", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span className="badge badge-amber" style={{ marginBottom: 12 }}>Competitive edge</span>
            <h2 style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>How we compare</h2>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ color: "var(--green)" }}>EcoCircuit</th>
                  <th>Attero</th>
                  <th>Karo Sambhav</th>
                  <th>RecycleKaro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI condition from photo", "✓", "✗", "✗", "✗"],
                  ["Value prediction (3 axes)", "✓", "✗", "✗", "✗"],
                  ["Consumer-facing UX", "✓", "Partial", "✗", "Partial"],
                  ["EPR auto-report (jsPDF)", "✓", "Manual", "✓", "✗"],
                  ["QR track & trace", "✓", "✗", "✗", "✗"],
                  ["Open source / auditable", "✓", "✗", "✗", "✗"],
                ].map(([feat, ...vals], i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{feat}</td>
                    {vals.map((v, j) => (
                      <td key={j} style={{ color: j === 0 ? "var(--green)" : v === "✗" ? "var(--text3)" : "var(--text2)" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MISSION / ABOUT STRIP */}
      <section className="section">
        <div className="container">
          <div className="card card-green" style={{ padding: "40px 36px", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <span className="badge badge-green" style={{ marginBottom: 14 }}>Mission</span>
              <h2 style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 12 }}>
                Every device deserves its<br />highest-value exit.
              </h2>
              <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>
                EcoCircuit routes India's e-waste through formal, high-value disposal pathways — for individuals and businesses. Anchored in EPR Rules 2022, transparent about its AI, honest about its data.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("about")}>
                Read our full mission <Icon name="arrow" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
              <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Post-hackathon integration targets</p>
              {partners.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(0,0,0,.3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{ padding: "80px 0", textAlign: "center", background: "var(--bg1)", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <h2 style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Ready to recycle smarter?</h2>
          <p style={{ color: "var(--text2)", marginBottom: 32, fontSize: 15 }}>Join individuals and businesses routing e-waste through its best path.</p>
          <MetalButton label="Get Started — It's Free" onClick={() => onNavigate("submit")} />
        </div>
      </section>
    </div>
  );
}

// ── SUBMIT PAGE ──
function SubmitPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<DeviceType | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [age, setAge] = useState(2);
  const [condition, setCondition] = useState("Good");
  const [photo, setPhoto] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const devices: { type: DeviceType; icon: string }[] = [
    { type: "Phone", icon: "phone" },
    { type: "Laptop", icon: "laptop" },
    { type: "Tablet", icon: "tablet" },
    { type: "TV", icon: "tv" },
    { type: "AC", icon: "ac" },
  ];

  const steps = ["Device Type", "Details", "Photo", "Analyzing"];

  const analyze = () => {
    setStep(3);
    const msgs = ["Reading condition from photo...", "Running value prediction...", "Matching partners..."];
    let i = 0;
    setLoadMsg(msgs[0]);
    const t = setInterval(() => {
      i++;
      if (i < msgs.length) setLoadMsg(msgs[i]);
      else { clearInterval(t); setTimeout(() => onNavigate("results"), 800); }
    }, 1100);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640, padding: "48px 24px" }}>
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, marginBottom: 28 }}>
            ← Back to home
          </button>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Submit a Device</h1>
          <p style={{ color: "var(--text2)", fontSize: 13.5 }}>AI reads condition from your photo · Value predicted in 60 seconds</p>
        </div>

        {/* Step bar */}
        <div className="step-bar" style={{ margin: "28px 0 36px" }}>
          {steps.map((s, i) => (
            <div key={i} className="step-item" style={{ flex: i < steps.length - 1 ? 1 : "unset" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className={`step-dot ${i < step ? "done" : i === step ? "active" : ""}`}>
                  {i < step ? <Icon name="check" size={14} color="#000" /> : i + 1}
                </div>
                <span className="step-label" style={{ color: i === step ? "var(--green)" : "var(--text3)" }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`step-line ${i < step ? "done" : ""}`} style={{ marginBottom: 16 }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "28px 24px" }}>
          {/* Step 0 — Device type */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>What type of device?</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                {devices.map((d) => (
                  <button key={d.type} onClick={() => setDevice(d.type)} style={{ padding: "18px 8px", borderRadius: "var(--radius-lg)", border: "2px solid", borderColor: device === d.type ? "var(--green)" : "var(--border2)", background: device === d.type ? "var(--green-gl)" : "var(--bg2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all .2s" }}>
                    <Icon name={d.icon} color={device === d.type ? "var(--green)" : "var(--text2)"} size={22} />
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: device === d.type ? "var(--green)" : "var(--text2)" }}>{d.type}</span>
                  </button>
                ))}
              </div>
              <button className="btn btn-primary" disabled={!device} onClick={() => setStep(1)} style={{ width: "100%", justifyContent: "center", marginTop: 24 }}>
                Next — Device Details
              </button>
            </div>
          )}

          {/* Step 1 — Details */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Device details</h2>
              <div className="input-group">
                <label className="input-label">Brand</label>
                <select className="select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="">Select brand</option>
                  {["Samsung", "Apple", "OnePlus", "Xiaomi", "Realme", "Dell", "HP", "Lenovo", "Sony", "LG", "Other"].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Model (optional)</label>
                <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Galaxy S21, MacBook Air" />
              </div>
              <div>
                <label className="input-label">Age: <strong style={{ color: "var(--text)" }}>{age} yr{age !== 1 ? "s" : ""}</strong></label>
                <input type="range" className="range" min={0} max={10} value={age} onChange={(e) => setAge(+e.target.value)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  <span>Brand new</span><span>10+ years old</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Condition (manual fallback — CLIP will auto-detect from photo)</label>
                <select className="select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                  {["Like-new", "Good", "Used", "Damaged", "Broken"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ flex: 1, justifyContent: "center" }}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(2)} style={{ flex: 2, justifyContent: "center" }}>Next — Upload Photo</button>
              </div>
            </div>
          )}

          {/* Step 2 — Photo */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Upload a photo</h2>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>CLIP will auto-detect condition from this photo — good lighting helps.</p>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target?.result as string); r.readAsDataURL(f); }
              }} />
              <div className={`drag-zone ${dragging ? "over" : ""}`} onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
                {photo ? (
                  <div>
                    <img src={photo} alt="Device" style={{ maxHeight: 200, borderRadius: 8, margin: "0 auto 12px", display: "block", objectFit: "contain" }} />
                    <p style={{ fontSize: 12.5, color: "var(--green)" }}>✓ Photo ready — CLIP will analyze this</p>
                  </div>
                ) : (
                  <div>
                    <Icon name="camera" color="var(--text3)" size={32} />
                    <p style={{ marginTop: 12, fontSize: 14, color: "var(--text2)" }}>Drag & drop or click to upload</p>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>JPG, PNG, WEBP · Max 10 MB</p>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: "center" }}>← Back</button>
                <button className="btn btn-primary" onClick={analyze} style={{ flex: 2, justifyContent: "center" }}>
                  <Icon name="cpu" size={15} color="#000" /> Analyze Device
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Analyzing */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 56, height: 56, border: "3px solid var(--border)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Reading your device...</h2>
              <p style={{ color: "var(--green)", fontSize: 14, animation: "fadeIn .4s" }}>{loadMsg}</p>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
                {["CLIP condition detection", "Random Forest valuation", "Partner matching"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--text2)", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", opacity: 0.6 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RESULTS PAGE ──
function ResultsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const partners = [
    { name: "Attero Recycling", type: "Certified Recycler", city: "Noida, UP", rating: 4.8, contact: "+91 98765 43210" },
    { name: "Karo Sambhav", type: "EPR Partner", city: "New Delhi", rating: 4.6, contact: "+91 91234 56789" },
    { name: "Namo eWaste", type: "Refurbisher + NGO", city: "Mumbai, MH", rating: 4.5, contact: "+91 87654 32109" },
  ];

  return (
    <div className="page">
      <div className="container" style={{ padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => onNavigate("submit")} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13.5 }}>← Resubmit</button>
          <span style={{ color: "var(--border2)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--text3)", fontFamily: "var(--mono)" }}>Device ID: ECO-2025-A7F3</span>
        </div>

        {/* Device summary */}
        <div className="card" style={{ padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 48, height: 48, background: "var(--green-gl)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="phone" color="var(--green)" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Samsung Galaxy S21</div>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>Phone · 2 years old</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="badge badge-green">Like-new</span>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>CLIP confidence: 89%</span>
          </div>
        </div>

        {/* Three value cards */}
        <div className="grid-3" style={{ marginBottom: 16 }}>
          {[
            { label: "Resale Value", value: "₹14,200", icon: "coin", color: "var(--green)", bg: "var(--green-gl)" },
            { label: "Refurb Viability", value: "0.82 / 1.0", icon: "trending", color: "var(--teal)", bg: "rgba(20,184,166,.1)" },
            { label: "Material Value", value: "₹3,400", icon: "recycle", color: "var(--amber)", bg: "rgba(245,158,11,.1)" },
          ].map((v, i) => (
            <div key={i} className="card" style={{ padding: "20px", borderColor: v.color + "33" }}>
              <div style={{ width: 36, height: 36, background: v.bg, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon name={v.icon} color={v.color} size={18} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mono)", color: v.color }}>{v.value}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{v.label}</div>
            </div>
          ))}
        </div>

        {/* Pathway recommendation */}
        <div className="card card-green" style={{ padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 40, height: 40, background: "var(--green-gl2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="sparkle" color="var(--green)" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Recommended: <span style={{ color: "var(--green)" }}>Resell</span></div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", marginTop: 2 }}>Highest estimated value given condition score and refurb viability</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--text3)", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: 6, fontFamily: "var(--mono)" }}>Deterministic rule — not AI</span>
        </div>

        {/* Commission fee */}
        <div style={{ padding: "12px 16px", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "var(--radius)", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13.5, color: "var(--text2)" }}>Platform fee (5% of estimated value)</span>
          <span style={{ fontFamily: "var(--mono)", fontWeight: 600, color: "var(--amber)" }}>₹710</span>
        </div>

        {/* Partners */}
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Top matched partners</h2>
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {partners.map((p, i) => (
            <div key={i} className={`card partner-card ${selected === i ? "selected" : ""}`} onClick={() => setSelected(i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 2 }}>{p.type}</div>
                </div>
                {selected === i && <span className="badge badge-green">Selected</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text2)", display: "flex", gap: 6 }}>
                <Icon name="map" size={13} color="var(--text3)" /> {p.city}
              </div>
              <div className="stars">{"★".repeat(Math.floor(p.rating))}<span style={{ color: "var(--text3)", fontSize: 11 }}> {p.rating}</span></div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>{p.contact}</div>
            </div>
          ))}
        </div>

        {/* Request Pickup CTA */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate("track")} style={{ flex: 1, justifyContent: "center" }} disabled={selected === null}>
            <Icon name="truck" size={16} color="#000" />
            Request Pickup — {selected !== null ? partners[selected].name : "Select a partner"}
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: "center" }}>
            <Icon name="download" size={15} /> QR Receipt
          </button>
        </div>
        {selected === null && <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>Select a partner above to request pickup</p>}
      </div>
    </div>
  );
}

// ── TRACK PAGE ──
function TrackPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const statusSteps = [
    { label: "Submitted", icon: "upload", done: true, time: "Aug 22, 10:14 AM" },
    { label: "Matched", icon: "check", done: true, time: "Aug 22, 10:15 AM" },
    { label: "Picked Up", icon: "truck", done: false, time: null },
    { label: "Processed", icon: "recycle", done: false, time: null },
  ];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720, padding: "40px 24px" }}>
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => onNavigate("results")} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 13.5, marginBottom: 24 }}>← Back to Results</button>
          <span className="badge badge-green" style={{ marginBottom: 12 }}>Live Tracking</span>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Track Device</h1>
        </div>

        {/* Device card */}
        <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Device ID: ECO-2025-A7F3</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Samsung Galaxy S21 · Phone</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Submitted Aug 22, 2025</div>
            </div>
            <span className="badge badge-amber">Matched</span>
          </div>
        </div>

        {/* Status stepper */}
        <div className="card" style={{ padding: "28px 24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 28 }}>Device Journey</h3>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {statusSteps.map((s, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  {i > 0 && <div style={{ flex: 1, height: 2, background: statusSteps[i - 1].done ? "var(--green)" : "var(--border)", transition: "background .4s" }} />}
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid", borderColor: s.done ? "var(--green)" : "var(--border2)", background: s.done ? "var(--green-gl)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: !s.done && i === statusSteps.findIndex(x => !x.done) ? "0 0 0 6px rgba(34,197,94,.12)" : "none", animation: !s.done && i === statusSteps.findIndex(x => !x.done) ? "glow-pulse 2s infinite" : "none" }}>
                    <Icon name={s.icon} color={s.done ? "var(--green)" : "var(--text3)"} size={17} />
                  </div>
                  {i < statusSteps.length - 1 && <div style={{ flex: 1, height: 2, background: s.done ? "var(--green)" : "var(--border)", transition: "background .4s" }} />}
                </div>
                <div style={{ textAlign: "center", marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.done ? "var(--text)" : "var(--text3)" }}>{s.label}</div>
                  {s.time && <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 2 }}>{s.time}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR panel */}
        <div className="grid-2">
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="qr" color="var(--green)" size={16} /> QR Code
            </h3>
            <div style={{ width: 120, height: 120, background: "var(--bg2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", border: "1px solid var(--border2)" }}>
              <svg viewBox="0 0 100 100" width="90" height="90" fill="var(--text)">
                {/* Simplified QR pattern */}
                <rect x="5" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="14" y="14" width="12" height="12" rx="1" />
                <rect x="65" y="5" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="74" y="14" width="12" height="12" rx="1" />
                <rect x="5" y="65" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="14" y="74" width="12" height="12" rx="1" />
                {[0,1,2,3,4].map(i => [0,1,2,3,4].map(j => Math.random() > .4 ? <rect key={`${i}-${j}`} x={42+j*10} y={42+i*10} width="7" height="7" rx="1" /> : null))}
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center" }}>Scan to track this device</p>
            <button className="btn btn-ghost btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
              <Icon name="download" size={14} /> Download PNG
            </button>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="building" color="var(--green)" size={16} /> Matched Partner
            </h3>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Attero Recycling</div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 8 }}>Certified Recycler</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text2)", marginBottom: 6 }}>
              <Icon name="map" size={13} color="var(--text3)" /> Noida, Uttar Pradesh
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 12 }}>+91 98765 43210</div>
            <div className="stars">★★★★★ <span style={{ fontSize: 11, color: "var(--text3)" }}>4.8</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── IMPACT PAGE ──
function ImpactPage() {
  const feed = [
    { device: "Samsung phone", city: "Delhi", path: "Refurbished", kg: 0.18 },
    { device: "Dell laptop", city: "Mumbai", path: "Resold", kg: 2.4 },
    { device: "LG TV", city: "Bengaluru", path: "Recycled", kg: 8.1 },
    { device: "Apple tablet", city: "Chennai", path: "Refurbished", kg: 0.72 },
    { device: "OnePlus phone", city: "Hyderabad", path: "Resold", kg: 0.21 },
    { device: "HP laptop", city: "Pune", path: "Recycled", kg: 2.85 },
  ];
  const bars = [
    { month: "Mar", resell: 42, refurb: 28, recycle: 30 },
    { month: "Apr", resell: 55, refurb: 25, recycle: 20 },
    { month: "May", resell: 48, refurb: 32, recycle: 20 },
    { month: "Jun", resell: 60, refurb: 22, recycle: 18 },
    { month: "Jul", resell: 71, refurb: 19, recycle: 10 },
    { month: "Aug", resell: 63, refurb: 24, recycle: 13 },
  ];
  const maxTotal = Math.max(...bars.map(b => b.resell + b.refurb + b.recycle));

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className="badge badge-green" style={{ marginBottom: 12 }}>Live Metrics</span>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: 34, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 8 }}>Platform Impact</h1>
            <p style={{ color: "var(--text2)", fontSize: 14 }}>Seeded data — real-scale simulation of India's e-waste routing potential</p>
          </div>

          <div className="grid-4" style={{ marginTop: 36, marginBottom: 48 }}>
            {[
              { label: "Devices Processed", value: 4821, icon: "check", suffix: "" },
              { label: "kg Diverted", value: 31480, icon: "leaf", suffix: "" },
              { label: "CO₂ Saved (kg)", value: 629600, icon: "world", suffix: "" },
              { label: "Value Recovered (₹)", value: 6842000, icon: "coin", suffix: "" },
            ].map((s, i) => (
              <div key={i} className="card stat-card">
                <div style={{ width: 32, height: 32, background: "var(--green-gl)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Icon name={s.icon} color="var(--green)" size={16} />
                </div>
                <div className="stat-num"><CountUp to={s.value} /></div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card" style={{ padding: "24px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Monthly devices by pathway</h3>
              <div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
                {[["Resell", "var(--green)"], ["Refurb", "var(--teal)"], ["Recycle", "var(--blue)"]].map(([l, c]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text2)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c as string, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 140 }}>
              {bars.map((b, i) => {
                const total = b.resell + b.refurb + b.recycle;
                const scale = 120 / maxTotal;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                      {[{ v: b.recycle, c: "var(--blue)" }, { v: b.refurb, c: "var(--teal)" }, { v: b.resell, c: "var(--green)" }].map((seg, si) => (
                        <div key={si} style={{ height: seg.v * scale, background: seg.c, borderRadius: si === 2 ? "4px 4px 0 0" : si === 0 ? "0 0 4px 4px" : 0, transition: "height 1s cubic-bezier(.22,.68,0,1.2)" }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10.5, color: "var(--text3)" }}>{b.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Recent activity</h3>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Anonymized · Updates every 30 seconds</p>
            {feed.map((f, i) => (
              <div key={i} className="feed-item">
                <div className="feed-dot" />
                <div style={{ flex: 1, fontSize: 13 }}>
                  <span style={{ color: "var(--text)" }}>A {f.device} in {f.city}</span>
                  <span style={{ color: "var(--text2)" }}> → {f.path} · {f.kg} kg diverted</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{i}m ago</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── BUSINESS PAGE ──
function BusinessPage({ isLoggedIn, onNavigate }: { isLoggedIn: boolean; onNavigate: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "epr" | "history" | "upload">("overview");

  if (!isLoggedIn) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)" }}>
        <div className="card" style={{ padding: "40px 36px", maxWidth: 420, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, background: "var(--green-gl)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name="lock" color="var(--green)" size={24} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Business dashboard</h2>
          <p style={{ color: "var(--text2)", fontSize: 13.5, marginBottom: 24, lineHeight: 1.6 }}>Sign in with a Business account to access EPR compliance reports, commission logs, and bulk upload.</p>
          <button className="btn btn-primary" onClick={() => onNavigate("login")} style={{ width: "100%", justifyContent: "center" }}>
            <Icon name="lock" size={15} color="#000" /> Sign in to continue
          </button>
        </div>
      </div>
    );
  }

  const devices = [
    { id: "ECO-2025-A7F3", type: "Phone", status: "Matched", path: "Resell", partner: "Attero", commission: "₹710", date: "Aug 22, 2025" },
    { id: "ECO-2025-B2D1", type: "Laptop", status: "Picked Up", path: "Refurb", partner: "Namo eWaste", commission: "₹1,240", date: "Aug 20, 2025" },
    { id: "ECO-2025-C9E8", type: "TV", status: "Processed", path: "Recycle", partner: "Karo Sambhav", commission: "₹320", date: "Aug 18, 2025" },
    { id: "ECO-2025-D4F2", type: "AC", status: "Submitted", path: "Pending", partner: "—", commission: "—", date: "Aug 23, 2025" },
  ];

  return (
    <div className="page">
      <div className="container" style={{ padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 10 }}>Business Dashboard</span>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>EPR Compliance Hub</h1>
            <p style={{ color: "var(--text2)", fontSize: 13.5, marginTop: 4 }}>TechCorp India Pvt. Ltd. · GSTIN: 07AABCT1234F1Z5</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} /> Download EPR Report</button>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate("submit")}><Icon name="upload" size={14} color="#000" /> Submit Device</button>
          </div>
        </div>

        {/* Commission summary */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: "Commission This Month", value: "₹8,340", icon: "coin", sub: "12 devices processed" },
            { label: "EPR Compliance Score", value: "87%", icon: "chart", sub: "Target: 70% by FY26" },
            { label: "kg Diverted (MTD)", value: "284 kg", icon: "leaf", sub: "CO₂ saved: 5,680 kg" },
          ].map((c, i) => (
            <div key={i} className="card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, background: "var(--green-gl)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={c.icon} color="var(--green)" size={15} />
                </div>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{c.label}</span>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{c.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg2)", borderRadius: "var(--radius)", padding: 4, marginBottom: 20, width: "fit-content" }}>
          {(["overview", "epr", "history", "upload"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: activeTab === t ? "var(--surface)" : "transparent", color: activeTab === t ? "var(--text)" : "var(--text2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .2s", textTransform: "capitalize" }}>
              {t === "epr" ? "EPR Table" : t === "upload" ? "Bulk Upload" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "history" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Device ID</th><th>Type</th><th>Status</th><th>Pathway</th><th>Partner</th><th>Commission</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{d.id}</td>
                    <td>{d.type}</td>
                    <td>
                      <span className={`badge ${d.status === "Processed" ? "badge-green" : d.status === "Picked Up" ? "badge-blue" : d.status === "Matched" ? "badge-amber" : "badge-blue"}`}>{d.status}</span>
                    </td>
                    <td>{d.path}</td>
                    <td>{d.partner}</td>
                    <td style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>{d.commission}</td>
                    <td style={{ color: "var(--text2)", fontSize: 12 }}>{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "epr" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Device Category</th><th>Count</th><th>Est. Weight (kg)</th><th>Pathway</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: "IT & Telecom Equipment", count: 8, kg: "18.4", path: "Refurb / Resell", status: "Compliant" },
                  { cat: "Consumer Electrical", count: 3, kg: "24.7", path: "Recycle", status: "Compliant" },
                  { cat: "Large Appliances", count: 1, kg: "48.2", path: "Recycle", status: "Pending" },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.cat}</td>
                    <td>{r.count}</td>
                    <td>{r.kg} kg</td>
                    <td>{r.path}</td>
                    <td><span className={`badge ${r.status === "Compliant" ? "badge-green" : "badge-amber"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Commission breakdown (Aug)</h3>
              {devices.filter(d => d.commission !== "—").map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text2)" }}>{d.id}</span>
                  <span style={{ color: "var(--green)", fontWeight: 600 }}>{d.commission}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Pathway distribution</h3>
              {[["Resell", 45, "var(--green)"], ["Refurb", 30, "var(--teal)"], ["Recycle", 25, "var(--blue)"]].map(([l, v, c]) => (
                <div key={l as string} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
                    <span style={{ color: "var(--text2)" }}>{l}</span>
                    <span style={{ color: c as string, fontWeight: 600 }}>{v}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg2)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v}%`, background: c as string, borderRadius: 3, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="card" style={{ padding: "28px 24px", maxWidth: 560 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
              <span className="badge badge-amber">F9 — Cut first if behind</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Bulk CSV Upload</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>PapaParse reads your CSV client-side, runs batch API calls, and writes to Firestore in one go. No server involved.</p>
            <div className="drag-zone" style={{ marginBottom: 16 }}>
              <Icon name="upload" color="var(--text3)" size={28} />
              <p style={{ marginTop: 10, fontSize: 14, color: "var(--text2)" }}>Drop your CSV here or click to browse</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost btn-sm"><Icon name="download" size={13} /> Sample CSV template</button>
              <button className="btn btn-primary btn-sm" style={{ justifyContent: "center" }}>Process CSV</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ABOUT PAGE ──
function AboutPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="badge badge-green" style={{ marginBottom: 14 }}>About EcoCircuit</span>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: "clamp(28px,5vw,42px)", fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 16 }}>
            "Route India's e-waste through<br />its highest-value formal pathway."
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 15, lineHeight: 1.75, marginBottom: 48 }}>
            For consumers and businesses alike — one platform to submit, value, match, and track electronic devices through certified disposal channels.
          </p>

          {/* Problem context */}
          <div className="card" style={{ padding: "24px", marginBottom: 20, borderLeft: "3px solid var(--red)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "var(--red)", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="info" size={16} color="var(--red)" /> The Problem
            </h3>
            <div className="grid-2" style={{ gap: 16 }}>
              {[
                { stat: "13.97L MT", label: "E-waste generated India FY25" },
                { stat: "Ranked 3rd", label: "Globally by volume" },
                { stat: "30%", label: "Informal sector handling" },
                { stat: "322", label: "Certified recyclers for 14L MT/yr" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{s.stat}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text2)", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--text2)", fontSize: 13.5, marginTop: 14, lineHeight: 1.6 }}>
              EPR Rules 2022 escalate targets from 60% to 70% by FY26. CPCB infrastructure can't handle the volume through informal channels alone. EcoCircuit routes devices to certified partners automatically.
            </p>
          </div>

          {/* Tech transparency */}
          <div className="card" style={{ padding: "24px", marginBottom: 20, borderLeft: "3px solid var(--green)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: "var(--green)", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="cpu" size={16} color="var(--green)" /> Tech Transparency
            </h3>
            <div className="grid-2" style={{ gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>✓ What is AI</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  <li style={{ fontSize: 13, color: "var(--text2)", paddingLeft: 12, borderLeft: "2px solid var(--green)" }}>
                    <strong style={{ color: "var(--text)" }}>CLIP</strong> — OpenAI's pretrained model reads device condition from your photo. We did not train this model.
                  </li>
                  <li style={{ fontSize: 13, color: "var(--text2)", paddingLeft: 12, borderLeft: "2px solid var(--teal)" }}>
                    <strong style={{ color: "var(--text)" }}>Random Forest</strong> — regression models trained on Kaggle + OLX data predict resale, refurb, and material values.
                  </li>
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>✗ What is NOT AI</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  <li style={{ fontSize: 13, color: "var(--text2)", paddingLeft: 12, borderLeft: "2px solid var(--border2)" }}>
                    <strong style={{ color: "var(--text)" }}>Pathway scoring</strong> — deterministic rules, not ML. Labelled clearly on the Results page.
                  </li>
                  <li style={{ fontSize: 13, color: "var(--text2)", paddingLeft: 12, borderLeft: "2px solid var(--border2)" }}>
                    <strong style={{ color: "var(--text)" }}>Partner ranking</strong> — rule-based by rating + city. Also labelled explicitly.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div className="card" style={{ padding: "24px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <Icon name="building" size={16} color="var(--blue)" /> Data Sources
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { src: "Kaggle + OLX India scraped listings", note: "Real market data · resale price training", type: "Real" },
                { src: "MCX India commodity prices", note: "Cited live — gold, copper, aluminium baselines", type: "Real" },
                { src: "Synthetic recycling dataset", note: "Methodology disclosed upfront", type: "Synthetic" },
              ].map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "var(--bg2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <span className={`badge ${d.type === "Real" ? "badge-green" : "badge-amber"}`}>{d.type}</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{d.src}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{d.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners */}
          <div className="card card-green" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Target partner ecosystem</h3>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 16 }}>
              These are post-hackathon integration targets — not claimed partnerships. We are explicit about this.
            </p>
            <div className="grid-2" style={{ gap: 10 }}>
              {["Attero Recycling", "Karo Sambhav", "Namo eWaste", "Cerebra Green"].map((p, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "rgba(0,0,0,.3)", borderRadius: "var(--radius)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>Target</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 36, display: "flex", gap: 12 }}>
            <button className="btn btn-primary" onClick={() => onNavigate("submit")}>Submit a Device <Icon name="arrow" size={15} color="#000" /></button>
            <button className="btn btn-ghost" onClick={() => onNavigate("home")}>Back to home</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  const navigate = useCallback((p: Page) => { setPage(p); setMobileOpen(false); }, []);

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "impact", label: "Impact", icon: "world" },
    { id: "business", label: "Business", icon: "building" },
    { id: "about", label: "About", icon: "info" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      {page !== "login" && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => navigate("home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            EcoCircuit
          </div>
          <div className="nav-links">
            {navItems.map((n) => (
              <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => navigate(n.id)}>{n.label}</button>
            ))}
          </div>
          <div className="nav-actions">
            {isLoggedIn ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("submit")}><Icon name="upload" size={14} /> Submit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsLoggedIn(false)}>Sign out</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("login")}>Sign in</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate("login")}>Get started</button>
              </>
            )}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ display: "none", background: "none", border: "none", color: "var(--text)", cursor: "pointer" }} className="mobile-toggle">
            <Icon name={mobileOpen ? "close" : "menu"} size={22} />
          </button>
        </nav>
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="mobile-menu" onClick={() => setMobileOpen(false)}>
          {navItems.map((n) => (
            <button key={n.id} onClick={() => navigate(n.id)} style={{ background: "none", border: "none", color: page === n.id ? "var(--green)" : "var(--text)", fontSize: 18, fontWeight: 500, cursor: "pointer", padding: "10px 0", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name={n.icon} color={page === n.id ? "var(--green)" : "var(--text2)"} size={18} />
              {n.label}
            </button>
          ))}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoggedIn ? (
              <button className="btn btn-ghost" onClick={() => setIsLoggedIn(false)}>Sign out</button>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => navigate("login")}>Sign in</button>
                <button className="btn btn-primary" onClick={() => navigate("login")}>Get started</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      {page === "home" && <HomePage onNavigate={navigate} />}
      {page === "login" && <LoginPage onLogin={() => { setIsLoggedIn(true); navigate("home"); }} onNavigate={navigate} />}
      {page === "submit" && <SubmitPage onNavigate={navigate} />}
      {page === "results" && <ResultsPage onNavigate={navigate} />}
      {page === "track" && <TrackPage onNavigate={navigate} />}
      {page === "impact" && <ImpactPage />}
      {page === "business" && <BusinessPage isLoggedIn={isLoggedIn} onNavigate={navigate} />}
      {page === "about" && <AboutPage onNavigate={navigate} />}

      {/* FOOTER */}
      {page !== "login" && (
        <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 0", marginTop: 0 }}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontWeight: 700, fontSize: 15, color: "var(--green)" }}>
              <Icon name="recycle" color="var(--green)" size={16} />
              EcoCircuit
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {navItems.map((n) => (
                <button key={n.id} onClick={() => navigate(n.id)} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 12.5, cursor: "pointer" }}>{n.label}</button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text3)" }}>
              CPCB portal · EPR Rules 2022 · Hackathon prototype
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
