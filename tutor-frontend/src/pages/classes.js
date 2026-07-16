import { api, esc, msg } from "../core/api.js";
import { days, subjects } from "../core/config.js";
import { shell } from "./layout.js";

export async function classesPage() {
  shell(
    "classes",
    "Classes",
    `<section class="page-intro class-page-intro"><div><p class="kicker">Class register</p><h2>Your teaching week, at a glance.</h2><p class="muted">Start attendance or manage a class without opening a long workspace.</p></div><button id="open-class-form" class="button">+ Add class</button></section><dialog id="class-dialog" class="management-dialog"><div class="dialog-heading"><div><p class="kicker">Class details</p><h3 id="class-form-title">Create class</h3></div><button id="close-class-form" class="icon-button" type="button" aria-label="Close">&times;</button></div><form id="class-form" class="grid-form"><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><label>Subject<select name="subject">${subjects.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Class name<input name="class_name" required placeholder="e.g. Grade 10 Mathematics"></label><label>Day<select name="day">${days.map((x, i) => `<option value="${i}">${x}</option>`).join("")}</select></label><label>Start time<input type="time" name="start_time" required></label><label>End time<input type="time" name="end_time" required></label><label>Monthly fee<input type="number" name="monthly_fee" min="0" required placeholder="2500"></label><div class="card-actions dialog-actions"><button class="button">Save class</button><button id="cancel-class-edit" class="button button-ghost" type="button">Cancel</button></div></form></dialog><dialog id="manage-class-dialog" class="management-dialog"><div class="dialog-heading"><div><p class="kicker">Class roster</p><h3 id="manage-class-title">Manage class</h3></div><button id="close-manage-class" class="icon-button" type="button" aria-label="Close">&times;</button></div><div id="manage-class-content"></div></dialog><section id="class-list" class="class-card-grid">Loading classes...</section>`,
  );
  const enrolNotice = sessionStorage.getItem("tuitionledger:enrol-notice");
  if (enrolNotice) {
    document
      .querySelector(".class-page-intro")
      .insertAdjacentHTML("afterend", msg(enrolNotice, "success"));
    sessionStorage.removeItem("tuitionledger:enrol-notice");
  }

  const form = document.querySelector("#class-form");
  const dialog = document.querySelector("#class-dialog");
  const manageDialog = document.querySelector("#manage-class-dialog");
  let editingClass = null;
  const resetForm = () => {
    editingClass = null;
    form.reset();
    dialog.close();
    document.querySelector("#class-form-title").textContent = "Create class";
    form.querySelector(
      'button[type="submit"], button:not([type])',
    ).textContent = "Save class";
  };
  document.querySelector("#cancel-class-edit").onclick = resetForm;
  document.querySelector("#close-class-form").onclick = resetForm;
  document.querySelector("#close-manage-class").onclick = () =>
    manageDialog.close();
  document.querySelector("#open-class-form").onclick = () => dialog.showModal();
  form.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await api(
        editingClass ? `/api/classes/${editingClass.id}` : "/api/classes",
        {
          method: editingClass ? "PUT" : "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        },
      );
      classesPage();
    } catch (error) {
      form.insertAdjacentHTML("beforebegin", msg(error.message, "error"));
    }
  };

  try {
    const [classes, students] = await Promise.all([
      api("/api/classes"),
      api("/api/students"),
    ]);
    const rosters = new Map(
      await Promise.all(
        classes.map(async (classItem) => [
          classItem.id,
          await api(`/api/classes/${classItem.id}/students`),
        ]),
      ),
    );
    const host = document.querySelector("#class-list");
    host.innerHTML =
      classes
        .map((classItem) => {
          const count = (rosters.get(classItem.id) || []).length;
          return `<article class="class-mini-card" data-class="${classItem.id}"><div class="class-mini-top"><span class="class-day">${esc(days[classItem.day]).slice(0, 3)}</span><span class="student-count">${count} student${count === 1 ? "" : "s"}</span></div><div><p class="kicker">${esc(classItem.start_time)}–${esc(classItem.end_time)}</p><h3>${esc(classItem.class_name)}</h3></div><div class="class-mini-actions"><a class="button button-small" href="#qr-session?class=${classItem.id}">Start QR</a><button class="button button-small button-ghost" data-manage="${classItem.id}">Manage</button></div></article>`;
        })
        .join("") ||
      `<article class="record-card"><h3>No classes yet</h3><p>Create your first class to enrol students and start attendance.</p></article>`;

    host.querySelectorAll("[data-manage]").forEach((button) => {
      button.onclick = () => {
        const classItem = classes.find(
          (item) => item.id === button.dataset.manage,
        );
        renderManager(classItem, rosters.get(classItem.id) || [], students);
      };
    });

    function renderManager(classItem, enrolled, allStudents) {
      const available = allStudents.filter(
        (student) => !enrolled.some((item) => item.id === student.id),
      );
      document.querySelector("#manage-class-title").textContent =
        classItem.class_name;
      const content = document.querySelector("#manage-class-content");
      content.innerHTML = `<p class="muted class-detail-line">${esc(days[classItem.day])} · ${esc(classItem.start_time)}–${esc(classItem.end_time)} · Rs. ${esc(classItem.monthly_fee)}/month</p><div class="class-roster">${enrolled.map((student) => `<div class="class-roster-row"><span><strong>${esc(student.full_name)}</strong><small>${esc(student.student_code)}</small></span><button class="button button-small button-ghost" data-remove-student="${student.id}">Remove</button></div>`).join("") || '<p class="muted">No students enrolled yet.</p>'}</div><section class="bulk-enrol"><div class="bulk-enrol-head"><div><p class="kicker">Available students</p><strong><span data-selected-count>0</span> selected</strong></div><input data-student-search type="search" placeholder="Search name or Student ID" aria-label="Search available students"></div><div class="bulk-enrol-tools"><label><input type="checkbox" data-select-all> Select all available</label><button class="text-button" type="button" data-clear-selection>Clear</button></div><div class="student-check-list">${available.map((student) => `<label class="student-check-row"><input type="checkbox" value="${student.id}" data-student-check><span><strong>${esc(student.full_name)}</strong><small>${esc(student.student_code)} · ${esc(student.grade)}</small></span></label>`).join("") || '<p class="muted">All active students are already enrolled.</p>'}</div><button class="button" data-enrol-selected ${available.length ? "" : "disabled"}>Enrol selected students</button></section><div class="dialog-footer"><button class="button button-small button-ghost" data-edit>Edit details</button><button class="button button-small danger" data-delete>Delete class</button></div>`;
      content.querySelector("[data-edit]").onclick = () => {
        manageDialog.close();
        editingClass = classItem;
        Object.entries(classItem).forEach(([key, value]) => {
          const field = form.elements.namedItem(key);
          if (field && value != null) field.value = value;
        });
        document.querySelector("#class-form-title").textContent = "Edit class";
        form.querySelector(
          'button[type="submit"], button:not([type])',
        ).textContent = "Update class";
        dialog.showModal();
      };
      content.querySelector("[data-delete]").onclick = async () => {
        if (confirm("Delete this class?")) {
          await api(`/api/classes/${classItem.id}`, { method: "DELETE" });
          classesPage();
        }
      };
      const checks = [...content.querySelectorAll("[data-student-check]")];
      const updateSelection = () => {
        content.querySelector("[data-selected-count]").textContent =
          checks.filter((check) => check.checked).length;
      };
      checks.forEach((check) => (check.onchange = updateSelection));
      content.querySelector("[data-select-all]").onchange = (event) => {
        checks
          .filter((check) => !check.closest("label").hidden)
          .forEach((check) => {
            check.checked = event.target.checked;
          });
        updateSelection();
      };
      content.querySelector("[data-clear-selection]").onclick = () => {
        checks.forEach((check) => (check.checked = false));
        content.querySelector("[data-select-all]").checked = false;
        updateSelection();
      };
      content.querySelector("[data-student-search]").oninput = (event) => {
        const query = event.target.value.trim().toLowerCase();
        content.querySelectorAll(".student-check-row").forEach((row) => {
          row.hidden = query && !row.textContent.toLowerCase().includes(query);
        });
      };
      content.querySelector("[data-enrol-selected]").onclick = async () => {
        const studentIds = checks
          .filter((check) => check.checked)
          .map((check) => check.value);
        if (!studentIds.length) return;
        const outcome = await api(
          `/api/classes/${classItem.id}/students/bulk`,
          {
            method: "POST",
            body: JSON.stringify({ student_ids: studentIds }),
          },
        );
        sessionStorage.setItem(
          "tuitionledger:enrol-notice",
          `${outcome.enrolled} enrolled, ${outcome.already_enrolled} already enrolled, ${outcome.failed.length} failed.`,
        );
        classesPage();
      };
      content.querySelectorAll("[data-remove-student]").forEach((remove) => {
        remove.onclick = async () => {
          await api(
            `/api/classes/${classItem.id}/students/${remove.dataset.removeStudent}`,
            { method: "DELETE" },
          );
          classesPage();
        };
      });
      manageDialog.showModal();
    }
  } catch (error) {
    document.querySelector("#class-list").innerHTML = msg(
      error.message,
      "error",
    );
  }
}
