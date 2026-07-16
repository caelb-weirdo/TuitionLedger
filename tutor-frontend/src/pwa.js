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

export function removeLegacyTutorPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) => new URL(registration.scope).origin === location.origin)
          .map((registration) => registration.unregister()),
      );
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.filter((name) => name.startsWith("tuitionledger-tutor-")).map((name) => caches.delete(name)));
    });
  }
}
