import { app, logo } from "../core/config.js";

export function landing() {
  const footerIcons = {
    features: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></svg>`,
    flow: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8.2 6h4.3a3 3 0 0 1 3 3v6.8M12.5 15.8H9a3 3 0 0 1-3-3V8.2"/></svg>`,
    login: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8l4 4-4 4M14 12H4"/></svg>`,
    faq: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4.5 6v5.6c0 4.2 2.8 7.9 7.5 9.4 4.7-1.5 7.5-5.2 7.5-9.4V6L12 3Z"/><path d="M9.8 9.5a2.3 2.3 0 1 1 3.5 2c-.8.5-1.3 1-1.3 2M12 16.8h.01"/></svg>`,
  };
  const steps = [
    ["Create a class", "Set the grade, subject, schedule, and monthly fee."],
    [
      "Share registration",
      "Students scan the registration QR in their phone browser.",
    ],
    [
      "Approve the request",
      "Review the student and connect one approved browser.",
    ],
    ["Enrol the student", "Add approved students to the correct class."],
    [
      "Start attendance",
      "Choose 5, 10, or 15 minutes and display the temporary QR.",
    ],
    [
      "Record the scan",
      "The approved browser verifies and records attendance.",
    ],
    [
      "Review records",
      "Correct attendance and track monthly fees from the workspace.",
    ],
  ];
  app.innerHTML = `<header class="site-header"><a class="logo" href="#top">${logo}</a><nav aria-label="Landing navigation"><a href="#features">Features</a><a href="#flow">How it works</a><a href="#preview">Preview</a><a href="#faq">FAQ</a><a href="#login">Sign in</a><a class="button button-small" href="#signup">Get started</a></nav></header><main><section class="hero"><div><p class="kicker">TuitionLedger / tutor workspace</p><h1>A clearer register for every class.</h1><p class="hero-text">Manage students, browser-approved QR attendance, monthly fees, and guardian reminders from one simple tutor workspace.</p><p class="advantage-pill">✓ No student accounts required</p><div class="hero-actions"><a class="button" href="#signup">Get started</a><a class="button button-ghost" href="#login">Sign in</a></div></div><div id="preview" class="mockups" aria-label="TuitionLedger product preview"><div class="laptop"><div class="screen"><div class="mini-top"><strong>TuitionLedger</strong><span>Tutor dashboard</span></div><div class="mini-grid"><div><b>Students</b><small>Approved records</small></div><div><b>Classes</b><small>Start attendance</small></div><div><b>Attendance</b><small>Permanent register</small></div><div><b>Fees</b><small>Monthly ledger</small></div></div></div><small>Tutor starts attendance</small></div><div class="phone"><div class="phone-speaker"></div><div class="phone-screen"><p class="mini-label">STUDENT WEBSITE</p><h3>Attendance recorded</h3><div class="check">✓</div><p>Grade 10 Mathematics</p></div><small>Student scans the temporary QR</small></div></div></section><section id="features" class="section"><div class="section-heading"><p class="kicker">Practical benefits</p><h2>Everything needed for the next class.</h2></div><div class="feature-grid"><article class="feature-card"><h3>Reduce manual work</h3><p>Use short-lived QR attendance with an approved student browser.</p></article><article class="feature-card"><h3>Keep records together</h3><p>Manage students, classes, enrolments, and attendance in one place.</p></article><article class="feature-card"><h3>Find unpaid fees</h3><p>Filter the monthly ledger and see outstanding totals quickly.</p></article><article class="feature-card"><h3>Prepare reminders</h3><p>Open a guardian WhatsApp message for the tutor to review and send.</p></article></div></section><section id="flow" class="section"><div class="section-heading"><p class="kicker">One connected workflow</p><h2>Registration to attendance and fees.</h2></div><div class="flow">${steps.map(([title, copy], index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${copy}</p></div>`).join("")}</div></section><section id="faq" class="section faq-section"><div class="section-heading"><p class="kicker">Frequently asked</p><h2>Simple answers for tutors and students.</h2></div><details><summary>Do students need accounts?</summary><p>No. Students register and use their approved phone browser without a password.</p></details><details><summary>What if a student changes phone or browser?</summary><p>The tutor can reset the old browser and approve a new browser request.</p></details><details><summary>Does the attendance QR expire?</summary><p>Yes. The tutor chooses a 5, 10, or 15-minute session and the server rejects expired scans.</p></details><details><summary>Can attendance be corrected?</summary><p>Yes. A tutor can change a status by recording a required reason.</p></details><details><summary>Does TuitionLedger send WhatsApp messages automatically?</summary><p>No. It opens a prepared message in WhatsApp so the tutor can review and send it.</p></details></section><section class="final-cta"><p class="kicker">Ready for the next class?</p><h2>Start with a real tutor account.</h2><a class="button" href="#signup">Get started</a></section></main><footer><span class="logo">${logo}</span><p>Simple student, attendance, and fee records for tuition tutors.</p><nav><a class="footer-link" href="#features">${footerIcons.features}<span>Features</span></a><a class="footer-link" href="#flow">${footerIcons.flow}<span>How it works</span></a><a class="footer-link" href="#login">${footerIcons.login}<span>Tutor login</span></a><a class="footer-link" href="#faq">${footerIcons.faq}<span>Privacy and FAQ</span></a></nav><small>© ${new Date().getFullYear()} TuitionLedger · HND project</small></footer>`;
}
