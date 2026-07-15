import { api, esc, msg } from '../core/api.js';
import { shell } from './layout.js';
export async function feesPage() {
  shell(
    "fees",
    "Fees",
    `<section class="page-intro"><p class="kicker">Monthly ledger</p><h2>Mark paid and remind clearly.</h2><p class="muted">Generate a month after enrolling students to create the fee rows.</p></section><article class="form-card"><form id="fee-form" class="inline-form"><label>Month<input type="month" name="month" required></label><button class="button">Generate fee rows</button></form><p id="fee-notice" class="form-notice" aria-live="polite"></p></article><section id="fee-list" class="list-grid" aria-live="polite">Loading fee records…</section>`,
  );
  document.querySelector("#fee-form").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.currentTarget.querySelector("button");
    const notice = document.querySelector("#fee-notice");
    button.disabled = true;
    button.textContent = "Generating…";
    notice.textContent = "Creating fee rows for the selected month.";
    try {
      await api("/api/fees/generate", {
        method: "POST",
        body: JSON.stringify({ month: `${e.currentTarget.month.value}-01` }),
      });
      feesPage();
    } catch (x) {
      button.disabled = false;
      button.textContent = "Generate fee rows";
      notice.textContent = x.message;
      notice.className = "form-notice error";
      e.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(x.message, "error"),
      );
    }
  };
  try {
    const list = await api("/api/fees"),
      host = document.querySelector("#fee-list");
    host.innerHTML =
      list
        .map(
          (x) =>
            `<article class="record-card"><span class="status-pill">${esc(x.status)}</span><h3>${esc(x.full_name)}</h3><p>${esc(x.class_name)} · ${esc(x.month)}</p><strong>Rs. ${esc(x.amount)}</strong><div class="card-actions"><button class="button button-small" data-paid="${x.id}">${x.status === "Paid" ? "Mark unpaid" : "Mark paid"}</button>${x.status === "Unpaid" ? `<button class="button button-small button-ghost" data-wa="${x.id}">WhatsApp reminder</button>` : ""}</div></article>`,
        )
        .join("") ||
      `<article class="record-card"><h3>No fee rows yet</h3><p>Enroll at least one approved student in a class, then generate a month.</p></article>`;
    host.querySelectorAll("[data-paid]").forEach(
      (b) =>
        (b.onclick = async () => {
          const x = list.find((v) => v.id === b.dataset.paid);
          const previous = b.textContent;
          b.disabled = true;
          b.textContent = "Saving…";
          try {
            await api(`/api/fees/${b.dataset.paid}`, {
              method: "PUT",
              body: JSON.stringify({
                status: x.status === "Paid" ? "Unpaid" : "Paid",
              }),
            });
            feesPage();
          } catch (e) {
            b.disabled = false;
            b.textContent = previous;
            host.insertAdjacentHTML("afterbegin", msg(e.message, "error"));
          }
        }),
    );
    host.querySelectorAll("[data-wa]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const x = await api(`/api/fees/${b.dataset.wa}/whatsapp`);
            window.open(x.url, "_blank", "noopener");
          } catch (e) {
            host.insertAdjacentHTML("afterbegin", msg(e.message, "error"));
          }
        }),
    );
  } catch (e) {
    document.querySelector("#fee-list").innerHTML = msg(e.message, "error");
  }
}
