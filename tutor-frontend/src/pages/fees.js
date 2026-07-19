import { api, clearApiCache, esc, msg } from "../core/api.js";
import {
  confirmDialog,
  filterFees,
  formatCurrency,
  formatMonth,
  skeletonRows,
} from "../ui.js";
import { shell } from "./layout.js";

const whatsappIcon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.3-4.3a8.5 8.5 0 1 1 15.7-4.5Z"/><path d="M8.2 7.8c.4 3.6 2.4 5.7 6 6.3l1.3-1.5c.3-.3.7-.3 1-.1l1.8.9"/></svg>`;

export async function feesPage() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  shell(
    "fees",
    "Fees",
    `<section class="page-intro"><div><p class="kicker">Monthly ledger</p><h2>Student payments, in one view.</h2><p class="muted">Review monthly fees and open prepared guardian WhatsApp reminders.</p></div></section><section class="filter-bar"><label>Month<input id="fee-month" type="month" value="${currentMonth}"></label><label>Class<select id="fee-class"><option value="">All classes</option></select></label><label>Status<select id="fee-status"><option value="">All statuses</option><option>Unpaid</option><option>Paid</option></select></label><label>Student<input id="fee-search" type="search" placeholder="Name or Student ID"></label><button id="refresh-fees" class="button button-ghost">Refresh</button></section><p id="fee-notice" class="form-notice" role="status" aria-live="polite"></p><section id="fee-summary" class="summary-strip"></section><section id="fee-ledger" class="fee-ledger" aria-live="polite">${skeletonRows()}</section>`,
  );
  const host = document.querySelector("#fee-ledger");
  const monthInput = document.querySelector("#fee-month");
  const notice = document.querySelector("#fee-notice");
  let rows = [];
  let sortDirection = 1;

  async function loadLedger(force = false) {
    host.innerHTML = skeletonRows();
    try {
      const month = monthInput.value;
      rows = await api(`/api/fees/ledger?month=${encodeURIComponent(month)}`, {
        force,
      });
      const classFilter = document.querySelector("#fee-class");
      const selected = classFilter.value;
      const classes = [
        ...new Set(
          rows.flatMap((row) => row.fees.map((fee) => fee.class_name)),
        ),
      ].sort();
      classFilter.innerHTML = `<option value="">All classes</option>${classes.map((name) => `<option ${name === selected ? "selected" : ""}>${esc(name)}</option>`).join("")}`;
      renderLedger();
    } catch (error) {
      host.innerHTML = `${msg(error.message, "error")}<button class="button" id="retry-fees">Retry</button>`;
      document.querySelector("#retry-fees").onclick = () => loadLedger(true);
    }
  }

  function renderLedger() {
    const visible = filterFees(rows, {
      search: document.querySelector("#fee-search").value,
      status: document.querySelector("#fee-status").value,
      className: document.querySelector("#fee-class").value,
    }).sort((a, b) => a.full_name.localeCompare(b.full_name) * sortDirection);
    const expected = visible.reduce(
      (sum, row) => sum + Number(row.combined_amount || 0),
      0,
    );
    const paid = visible
      .filter((row) => row.payment_status === "Paid")
      .reduce((sum, row) => sum + Number(row.combined_amount || 0), 0);
    document.querySelector("#fee-summary").innerHTML =
      `<article><span>Expected · ${formatMonth(monthInput.value)}</span><strong>${formatCurrency(expected)}</strong></article><article><span>Collected</span><strong>${formatCurrency(paid)}</strong></article><article><span>Outstanding</span><strong>${formatCurrency(expected - paid)}</strong></article><article><span>Students</span><strong>${visible.length}</strong></article>`;
    host.innerHTML = `<div class="fee-ledger-head"><button data-sort>Student <span class="sort-direction" aria-hidden="true">${sortDirection > 0 ? "↑" : "↓"}</span></button><span>Grade</span><span>Classes</span><span>Total</span><span>Status</span><span>Reminder</span></div>${visible.map((row) => `<article class="fee-ledger-record" data-student="${row.student_id}"><div class="fee-ledger-row"><button class="row-expander" aria-label="Show fee breakdown" aria-expanded="false">›</button><span class="fee-student"><strong>${esc(row.full_name)}</strong><small>${esc(row.student_code)}</small></span><span><small class="fee-mobile-label">Grade</small>${esc(row.grade)}</span><span><small class="fee-mobile-label">Classes</small>${row.class_count}</span><strong><small class="fee-mobile-label">Amount</small>${formatCurrency(row.combined_amount)}</strong><button class="payment-switch ${row.payment_status.toLowerCase()}" role="switch" aria-label="Mark ${row.payment_status === "Paid" ? "unpaid" : "paid"}" aria-checked="${row.payment_status === "Paid"}" data-payment><span></span><b>${esc(row.payment_status)}</b></button><span class="fee-reminder">${row.payment_status === "Unpaid" ? `<button class="whatsapp-icon" aria-label="Open prepared WhatsApp reminder" data-tooltip="Open prepared WhatsApp reminder" data-whatsapp>${whatsappIcon}<span class="mobile-action-label">WhatsApp reminder</span></button>` : "—"}</span></div><div class="fee-breakdown" hidden><p class="muted">A combined payment update affects every listed class fee for this month.</p>${row.fees.map((fee) => `<div><span>${esc(fee.class_name)}</span><span>${formatCurrency(fee.amount)}</span><span class="status-pill">${esc(fee.status)}</span></div>`).join("")}</div></article>`).join("") || `<div class="empty-state"><h3>No fee records</h3><p>No students match the selected month and filters.</p></div>`}`;
    host.querySelector("[data-sort]")?.addEventListener("click", () => {
      sortDirection *= -1;
      renderLedger();
    });
    host.querySelectorAll(".fee-ledger-record").forEach((record) => {
      const row = rows.find(
        (item) => item.student_id === record.dataset.student,
      );
      const expander = record.querySelector(".row-expander");
      expander.onclick = () => {
        const details = record.querySelector(".fee-breakdown");
        details.hidden = !details.hidden;
        expander.setAttribute("aria-expanded", String(!details.hidden));
      };
      record.querySelector("[data-payment]").onclick = async () => {
        const nextStatus = row.payment_status === "Paid" ? "Unpaid" : "Paid";
        if (
          !(await confirmDialog({
            title: `Mark ${row.full_name} ${nextStatus.toLowerCase()}?`,
            message: `${formatMonth(monthInput.value)} · ${formatCurrency(row.combined_amount)}`,
            confirmLabel: `Mark ${nextStatus.toLowerCase()}`,
            danger: nextStatus === "Unpaid",
          }))
        )
          return;
        try {
          await api(
            `/api/students/${row.student_id}/fees/${monthInput.value}`,
            { method: "PUT", body: JSON.stringify({ status: nextStatus }) },
          );
          notice.textContent = `${row.full_name} marked ${nextStatus.toLowerCase()}.`;
          notice.className = "form-notice success";
          await loadLedger(true);
        } catch (error) {
          notice.textContent = error.message;
          notice.className = "form-notice error";
        }
      };
      record
        .querySelector("[data-whatsapp]")
        ?.addEventListener("click", async () => {
          try {
            const result = await api(
              `/api/students/${row.student_id}/fees/${monthInput.value}/whatsapp`,
            );
            notice.textContent = "Opening the prepared reminder in WhatsApp…";
            notice.className = "form-notice success";
            window.location.assign(result.url);
          } catch (error) {
            notice.textContent = error.message;
            notice.className = "form-notice error";
          }
        });
    });
  }
  monthInput.onchange = () => loadLedger(true);
  ["#fee-search", "#fee-status", "#fee-class"].forEach((selector) =>
    document
      .querySelector(selector)
      .addEventListener(
        selector === "#fee-search" ? "input" : "change",
        renderLedger,
      ),
  );
  document.querySelector("#refresh-fees").onclick = () => {
    clearApiCache();
    loadLedger(true);
  };
  loadLedger();
}
