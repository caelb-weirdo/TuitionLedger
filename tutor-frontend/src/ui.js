const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "—";
export const formatMonth = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}-01T00:00:00Z`))
    : "—";
export const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function filterAttendance(rows, date = "", status = "") {
  return rows.filter(
    (row) =>
      (!date || row.attendance_date === date) &&
      (!status || row.status === status),
  );
}

export function attendanceSummary(rows) {
  const present = rows.filter((row) => row.status === "Present").length;
  const absent = rows.filter((row) => row.status === "Absent").length;
  return {
    expected: rows.length,
    present,
    absent,
    percentage: rows.length ? Math.round((present / rows.length) * 100) : 0,
  };
}

export function filterFees(
  rows,
  { search = "", status = "", className = "" } = {},
) {
  const needle = search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (!needle ||
        `${row.full_name} ${row.student_code}`
          .toLowerCase()
          .includes(needle)) &&
      (!status || row.payment_status === status) &&
      (!className || row.fees.some((fee) => fee.class_name === className)),
  );
}

export const skeletonRows = (count = 4) =>
  `<div class="skeleton-list" aria-label="Loading">${Array.from({ length: count }, () => '<span class="skeleton-row"></span>').join("")}</div>`;

export function confirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "management-dialog confirmation-dialog";
    dialog.innerHTML = `<form method="dialog"><div class="dialog-heading"><div><p class="kicker">Please confirm</p><h3>${esc(title)}</h3></div></div><p>${esc(message)}</p><div class="dialog-actions"><button value="cancel" class="button button-ghost">Cancel</button><button value="confirm" class="button ${danger ? "danger" : ""}">${esc(confirmLabel)}</button></div></form>`;
    document.body.append(dialog);
    dialog.addEventListener(
      "close",
      () => {
        const confirmed = dialog.returnValue === "confirm";
        dialog.remove();
        resolve(confirmed);
      },
      { once: true },
    );
    dialog.showModal();
  });
}
