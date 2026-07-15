let installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  bindInstallButton();
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  bindInstallButton();
});

export function bindInstallButton() {
  const button = document.querySelector("#install-app");
  if (!button) return;
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  button.hidden = installed || !installPrompt;
  button.onclick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  };
}

export function registerTutorPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
}
