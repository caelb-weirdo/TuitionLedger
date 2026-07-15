function showRuntimeError() {
  const app = document.querySelector("#app");
  if (!app || app.querySelector(".runtime-error")) return;
  const notice = document.createElement("p");
  notice.className = "runtime-error";
  notice.setAttribute("role", "alert");
  notice.textContent =
    "This section could not load. Please check your connection and try again.";
  app.prepend(notice);
}
window.addEventListener(
  "error",
  (event) => {
    if (
      /Cannot (set|read) properties of null|insertAdjacentHTML/.test(
        event.message || "",
      )
    ) {
      event.preventDefault();
      showRuntimeError();
    }
  },
  true,
);
window.addEventListener(
  "unhandledrejection",
  (event) => {
    if (
      /Cannot (set|read) properties of null|insertAdjacentHTML/.test(
        String(event.reason?.message || event.reason || ""),
      )
    ) {
      event.preventDefault();
      showRuntimeError();
    }
  },
  true,
);
