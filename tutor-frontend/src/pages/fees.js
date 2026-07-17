import { api, clearApiCache, esc, msg } from "../core/api.js";
import { shell } from "./layout.js";

const chevronIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const whatsappIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7l-4.2 1.1 1.1-4A8 8 0 1 1 20 11.6Z"/><path d="M8.1 7.8c.4 3.5 2.4 5.5 5.9 6.1l1.2-1.4c.3-.3.6-.3 1-.1l2 1"/></svg>';

export async function feesPage() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  shell(
    "fees",
    "Fees",
    `<section class="page-intro fee-page-intro"><div><p class="kicker">Monthly ledger</p><h2>Student payments, in one view.</h2><p class="muted">Each row combines the selected student’s active class fees.</p></div><div class="fee-ledger-controls"><input id="fee-month" type="month" value="${currentMonth}" aria-label="Fee month"><select id="fee-status-filter" aria-label="Payment status"><option value="">All statuses</option><option>Unpaid</option><option>Paid</option></select><input id="fee-search" type="search" placeholder="Search students" aria-label="Search students"><button id="refresh-fees" class="icon-action" aria-label="Refresh fees" data-tooltip="Refresh fees"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8m16 8-2.2 1.8A7 7 0 0 1 5.5 15"/></svg></button></div></section><section id="fee-ledger" class="fee-ledger" aria-live="polite"><p class="muted">Loading monthly ledger...</p></section>`,
  );
  const host = document.querySelector("#fee-ledger");
  const monthInput = document.querySelector("#fee-month");
  let rows = [];
  let sortDirection = 1;

  async function loadLedger(force = false) {
    const month = monthInput.value;
    try {
      const readyKey = `tuitionledger:fees-ready:${month}`;
      if (!sessionStorage.getItem(readyKey)) {
        await api("/api/fees/ensure", {
          method: "POST",
          body: JSON.stringify({ month }),
        });
        sessionStorage.setItem(readyKey, "true");
      }
      rows = await api(`/api/fees/ledger?month=${encodeURIComponent(month)}`, {
        force,
      });
      renderLedger();
    } catch (error) {
      host.innerHTML = msg(error.message, "error");
    }
  }

  function renderLedger() {
    const search = document
      .querySelector("#fee-search")
      .value.trim()
      .toLowerCase();
    const status = document.querySelector("#fee-status-filter").value;
    const visible = rows
      .filter(
        (row) =>
          (!search ||
            `${row.full_name} ${row.student_code}`
              .toLowerCase()
              .includes(search)) &&
          (!status || row.payment_status === status),
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name) * sortDirection);
    host.innerHTML = `<div class="fee-ledger-head"><button data-sort-name>Student</button><span>Grade</span><span>Classes</span><span>Total</span><span>Status</span><span>Reminder</span></div>${
      visible
        .map(
          (row) =>
            `<article class="fee-ledger-record" data-student="${row.student_id}"><div class="fee-ledger-row"><button class="row-expander" aria-label="Show fee breakdown" aria-expanded="false">${chevronIcon}</button><span class="fee-student"><strong>${esc(row.full_name)}</strong><small>${esc(row.student_code)}</small></span><span>${esc(row.grade)}</span><span>${row.class_count}</span><strong>Rs. ${esc(row.combined_amount)}</strong><button class="payment-switch ${row.payment_status.toLowerCase()}" role="switch" aria-checked="${row.payment_status === "Paid"}" data-payment><span></span><b>${esc(row.payment_status)}</b></button><span class="fee-reminder">${row.payment_status === "Unpaid" ? `<button class="whatsapp-icon" aria-label="Send WhatsApp fee reminder" data-tooltip="Send WhatsApp reminder" data-whatsapp>${whatsappIcon}</button>` : "—"}</span></div><div class="fee-breakdown" hidden>${row.fees.map((fee) => `<div><span>${esc(fee.class_name)}</span><span>Rs. ${esc(fee.amount)}</span><span class="status-pill">${esc(fee.status)}</span></div>`).join("")}</div></article>`,
        )
        .join("") ||
      '<p class="empty-ledger">No students match this month and filter.</p>'
    }`;
    bindRows();
  }

  function bindRows() {
    host.querySelector("[data-sort-name]")?.addEventListener("click", () => {
      sortDirection *= -1;
      renderLedger();
    });
    host.querySelectorAll(".fee-ledger-record").forEach((record) => {
      const row = rows.find(
        (item) => item.student_id === record.dataset.student,
      );
      const expander = record.querySelector(".row-expander");
      expander.onclick = () => {
        const breakdown = record.querySelector(".fee-breakdown");
        breakdown.hidden = !breakdown.hidden;
        expander.setAttribute("aria-expanded", String(!breakdown.hidden));
      };
      record.querySelector("[data-payment]").onclick = async () => {
        await api(`/api/students/${row.student_id}/fees/${monthInput.value}`, {
          method: "PUT",
          body: JSON.stringify({
            status: row.payment_status === "Paid" ? "Unpaid" : "Paid",
          }),
        });
        await loadLedger(true);
      };
      record
        .querySelector("[data-whatsapp]")
        ?.addEventListener("click", async () => {
          const result = await api(
            `/api/students/${row.student_id}/fees/${monthInput.value}/whatsapp`,
          );
          window.open(result.url, "_blank", "noopener");
        });
    });
  }

  monthInput.onchange = () => loadLedger(true);
  document.querySelector("#fee-search").oninput = renderLedger;
  document.querySelector("#fee-status-filter").onchange = renderLedger;
  document.querySelector("#refresh-fees").onclick = () => {
    clearApiCache();
    loadLedger(true);
  };
  loadLedger();
}
