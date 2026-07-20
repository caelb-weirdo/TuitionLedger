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
  const buttons = document.querySelectorAll("[data-install-app]");
  if (!buttons.length) return;
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  buttons.forEach((button) => {
    button.hidden = installed || !installPrompt;
    button.onclick = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      buttons.forEach((item) => {
        item.hidden = true;
      });
    };
  });
}

export function registerTutorPwa() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("/sw.js");
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          document.dispatchEvent(new CustomEvent("tuitionledger:update-ready"));
        }
      });
    });
  });
}
