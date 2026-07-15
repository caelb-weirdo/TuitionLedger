import { api, esc, msg } from '../core/api.js';
import { app, subjects, days } from '../core/config.js';
import { shell } from './layout.js';
export async function classesPage() {
  shell(
    "classes",
    "Classes",
    `<section class="page-intro"><p class="kicker">Class register</p><h2>Build the week around your subjects.</h2></section><article class="form-card"><h3>Create class</h3><form id="class-form" class="grid-form"><label>Grade<select name="grade"><option>Grade 10</option><option>Grade 11</option></select></label><label>Subject<select name="subject">${subjects.map((x) => `<option>${x}</option>`).join("")}</select></label><label>Class name<input name="class_name" required></label><label>Day<select name="day">${days.map((x, i) => `<option value="${i}">${x}</option>`).join("")}</select></label><label>Start time<input type="time" name="start_time" required></label><label>End time<input type="time" name="end_time" required></label><label>Monthly fee<input type="number" name="monthly_fee" min="0" required></label><button class="button">Save class</button></form></article><section id="class-list" class="list-grid">Loading classes...</section>`,
  );
  let editingClass = null;
  document.querySelector("#class-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(
        editingClass ? `/api/classes/${editingClass.id}` : "/api/classes",
        {
          method: editingClass ? "PUT" : "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        },
      );
      editingClass = null;
      classesPage();
    } catch (x) {
      e.currentTarget.insertAdjacentHTML(
        "beforebegin",
        msg(x.message, "error"),
      );
    }
  };
  try {
    const list = await api("/api/classes"),
      host = document.querySelector("#class-list");
    host.innerHTML =
      list
        .map(
          (x) =>
            `<article class="record-card"><span class="status-pill">${esc(x.grade)} · ${esc(x.subject)}</span><h3>${esc(x.class_name)}</h3><p>${days[x.day]} · ${esc(x.start_time)} – ${esc(x.end_time)}</p><strong>Rs. ${esc(x.monthly_fee)}</strong><button class="button button-small danger" data-delete="${x.id}">Delete</button></article>`,
        )
        .join("") ||
      `<article class="record-card"><h3>No classes yet</h3><p>Create Grade 11 Maths or Grade 10 Science to begin.</p></article>`;
    host.querySelectorAll("[data-delete]").forEach((deleteButton) => {
      const editButton = document.createElement("button");
      editButton.className = "button button-small button-ghost";
      editButton.textContent = "Edit";
      editButton.type = "button";
      deleteButton.parentElement.insertBefore(editButton, deleteButton);
      editButton.onclick = () => {
        editingClass = list.find(
          (item) => item.id === deleteButton.dataset.delete,
        );
        const form = document.querySelector("#class-form");
        Object.entries(editingClass || {}).forEach(([key, value]) => {
          const field = form.elements.namedItem(key);
          if (field && value != null) field.value = value;
        });
        form.querySelector("button").textContent = "Update class";
        form.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    });
    host.querySelectorAll("[data-delete]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (confirm("Delete this class?")) {
            await api(`/api/classes/${b.dataset.delete}`, { method: "DELETE" });
            classesPage();
          }
        }),
    );
  } catch (e) {
    document.querySelector("#class-list").innerHTML = msg(e.message, "error");
  }
}
