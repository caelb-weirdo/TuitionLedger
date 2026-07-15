const busy = new WeakSet();
function markBusy(button) {
  if (!button || busy.has(button)) return;
  busy.add(button);
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.dataset.loadingLabel = button.textContent;
  button.textContent = "Working…";
  setTimeout(() => {
    if (busy.has(button)) {
      busy.delete(button);
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = button.dataset.loadingLabel;
    }
  }, 15000);
}
document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button.button,button.primary");
    if (button && !button.disabled && !button.closest("#auth-form"))
      markBusy(button);
  },
  true,
);
new MutationObserver(() =>
  document.querySelectorAll("button[aria-busy]").forEach((button) => {
    if (!button.isConnected) {
      busy.delete(button);
    }
  }),
).observe(document.body, { childList: true, subtree: true });
