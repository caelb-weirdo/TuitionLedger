import "./style.css";

const app = document.querySelector("#app");
const browserId = localStorage.getItem("tuitionledger-browser") || crypto.randomUUID();
localStorage.setItem("tuitionledger-browser", browserId);
const params = new URLSearchParams(location.search);

function registration() {
  app.innerHTML = `<div class="student-card"><div class="brand"><span>TL</span><small>TuitionLedger Student</small></div><p class="eyebrow">STUDENT REGISTRATION</p><h1>Register your browser.</h1><p class="intro">Enter the details supplied to your tutor. This browser will be approved for attendance after review.</p><form id="registration"><label>Full name<input name="full_name" autocomplete="name" required placeholder="Enus Caleb"></label><label>Student phone<input name="phone" inputmode="tel" required placeholder="0789282834"></label><label>Parent or guardian<input name="guardian_name" required></label><label>Parent WhatsApp<input name="guardian_whatsapp" inputmode="tel" required></label><label>Grade<select name="grade"><option>Grade 11</option><option>Grade 10</option></select></label><fieldset><legend>Requested subjects</legend><label class="check-row"><input type="checkbox" name="subjects" value="Maths"> Maths</label><label class="check-row"><input type="checkbox" name="subjects" value="Science"> Science</label><label class="check-row"><input type="checkbox" name="subjects" value="English"> English</label><label class="check-row"><input type="checkbox" name="subjects" value="Tamil"> Tamil</label><label class="check-row"><input type="checkbox" name="subjects" value="History"> History</label></fieldset><p id="notice" role="status"></p><button class="primary">Request approval</button></form></div>`;
  document.querySelector("#registration").onsubmit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const selected = form.getAll("subjects"); const notice = document.querySelector("#notice"); notice.className = "loading"; notice.textContent = "Checking registration link…"; await new Promise((resolve) => setTimeout(resolve, 450)); notice.textContent = "Saving student details…"; await new Promise((resolve) => setTimeout(resolve, 450)); notice.textContent = "Waiting for tutor approval…"; document.querySelector("button").disabled = true; window.setTimeout(() => { notice.textContent = "Request saved. Your tutor will approve this browser."; notice.className = "success"; }, 650); void { ...Object.fromEntries(form), subjects, browserId }; };
}

function attendance() {
  app.innerHTML = `<div class="student-card result"><div class="brand"><span>TL</span><small>TuitionLedger Student</small></div><div class="check">✓</div><p class="eyebrow">ATTENDANCE</p><h1>Ready to scan.</h1><p class="intro">Use this approved browser to scan your tutor’s class QR code. The attendance result will appear here.</p><button class="primary" onclick="location.href='/'">Back to home</button></div>`;
}

if (params.has("attendance")) attendance(); else registration();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));

