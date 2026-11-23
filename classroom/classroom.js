"use strict";

const nodes = {
  heading: document.getElementById("currentCourseHeading"),
  description: document.getElementById("courseDescription"),
  hours: document.getElementById("plannedHours"),
  lessons: document.getElementById("listedLessons"),
  materialsCount: document.getElementById("approvedMaterials"),
  lessonsList: document.getElementById("lessonList"),
  materialsList: document.getElementById("materialsList"),
  status: document.getElementById("courseStatus"),
  source: document.getElementById("sourceNote"),
  mathLink: document.getElementById("openMath")
};
const state = { courseId: "m4", courses: [], materials: null, expanded: false };

function make(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function publicMaterials() {
  if (!Array.isArray(state.materials)) return null;
  const course = state.courses.find((entry) => entry.id === state.courseId);
  if (!course) return [];
  return state.materials.filter((item) =>
    item && item.visibility === "PUBLIC_APPROVED" &&
    item.approval_status === "approved" && item.publication_state === "published" &&
    item.level === course.grade && typeof item.file_url === "string" &&
    isHttps(item.file_url)
  );
}

function isHttps(value) {
  try { return new URL(value).protocol === "https:"; }
  catch { return false; }
}

function renderCourse() {
  const course = state.courses.find((entry) => entry.id === state.courseId);
  for (const button of document.querySelectorAll("[data-course]")) {
    const active = button.dataset.course === state.courseId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  nodes.lessonsList.replaceChildren();
  if (!course) {
    nodes.heading.textContent = "ไม่สามารถอ่านผังบทเรียนได้";
    nodes.description.textContent = "ข้อมูลยังไม่พร้อม กรุณาลองรีเฟรชหน้า";
    nodes.hours.textContent = "—";
    nodes.lessons.textContent = "—";
    nodes.materialsCount.textContent = "—";
    nodes.lessonsList.append(make("p", "empty", "ไม่พบผังบทเรียนสาธารณะที่ตรวจสอบรูปแบบได้"));
    nodes.mathLink.href = "../math.html";
    renderMaterials();
    return;
  }

  nodes.heading.textContent = course.grade + " · " + course.title;
  nodes.description.textContent = course.description;
  nodes.hours.textContent = String(course.planned_hours);
  nodes.lessons.textContent = String(course.lessons.length);
  nodes.status.textContent = "ผังร่าง";
  nodes.mathLink.href = "../math.html#" + course.id + "-h1";
  nodes.source.textContent = "ข้อมูลจากผังบทเรียนสาธารณะ (" + course.grade + ") · ยังไม่ใช่ชั่วโมงที่สอนจริงหรือสื่อที่ผ่านตรวจรับ";

  const visible = state.expanded ? course.lessons : course.lessons.slice(0, 5);
  for (const lesson of visible) {
    const card = make("article", "lesson-card");
    card.append(make("span", "lesson-number", "ชม. " + lesson.hour));
    const body = make("div", "lesson-body");
    body.append(make("strong", "", lesson.title));
    body.append(make("p", "", lesson.focus));
    card.append(body);
    card.append(make("small", "", "ตามผังร่าง"));
    nodes.lessonsList.append(card);
  }
  if (course.lessons.length > 5) {
    const toggle = make("button", "action expand-button", state.expanded ? "ย่อรายการ" : "ดูทั้งหมด " + course.lessons.length + " ชั่วโมง");
    toggle.type = "button";
    toggle.addEventListener("click", () => {
      state.expanded = !state.expanded;
      renderCourse();
      if (!state.expanded) document.getElementById("lessons").scrollIntoView({block:"start"});
    });
    nodes.lessonsList.append(toggle);
  }

  const available = publicMaterials();
  nodes.materialsCount.textContent = available === null ? "—" : String(available.length);
  renderMaterials();
}

function renderMaterials() {
  const root = nodes.materialsList;
  root.replaceChildren();
  const items = publicMaterials();
  if (items === null) {
    root.append(make("h3", "", "ยังตรวจสอบทะเบียนสื่อไม่ได้"));
    root.append(make("p", "", "กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง ไม่สามารถยืนยันจำนวนสื่อได้ในขณะนี้"));
    return;
  }
  const grade = state.courses.find((entry) => entry.id === state.courseId)?.grade || "ชั้นที่เลือก";
  if (items.length === 0) {
    root.append(make("h3", "", "ยังไม่มีรายการสื่อสาธารณะที่อนุมัติสำหรับ " + grade));
    root.append(make("p", "", "สื่อที่อยู่ระหว่างจัดทำหรือตรวจรับจะไม่ถูกแสดงที่นี่ และไม่ถือว่าผ่านการอนุมัติแล้ว"));
    return;
  }
  root.append(make("h3", "", "สื่อที่เผยแพร่แล้วสำหรับ " + grade + " · " + items.length + " รายการ"));
  const list = make("div", "published-list");
  for (const item of items) {
    const link = make("a", "published-item", item.title + " · รุ่น " + item.version + " ↗");
    link.href = item.file_url;
    link.rel = "noopener noreferrer";
    list.append(link);
  }
  root.append(list);
}

async function loadJson(path) {
  const response = await fetch(path, {cache: "no-store"});
  if (!response.ok) throw new Error("Public data unavailable");
  return response.json();
}

async function loadAll() {
  const [outline, catalog] = await Promise.allSettled([
    loadJson("../data/public-math-outline.json"),
    loadJson("../data/public-materials.json")
  ]);
  if (outline.status === "fulfilled" &&
      outline.value.schema_version === 1 &&
      outline.value.publication_scope === "PUBLIC_OUTLINE_ONLY" &&
      Array.isArray(outline.value.courses)) {
    state.courses = outline.value.courses.filter((course) =>
      ["m2","m4"].includes(course?.id) &&
      Array.isArray(course?.lessons) &&
      Number.isInteger(course?.planned_hours)
    );
  }
  if (catalog.status === "fulfilled" &&
      catalog.value.schema_version === 1 &&
      Array.isArray(catalog.value.materials)) {
    state.materials = catalog.value.materials;
  }
  renderCourse();
}

for (const button of document.querySelectorAll("[data-course]")) {
  button.addEventListener("click", () => {
    state.courseId = button.dataset.course;
    state.expanded = false;
    renderCourse();
  });
}

const dialog = document.getElementById("statusDialog");
for (const id of ["aboutButton","accountInfoButton"]) {
  document.getElementById(id).addEventListener("click", () => dialog.showModal());
}
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

for (const anchor of document.querySelectorAll(".mobile-nav a")) {
  anchor.addEventListener("click", () => {
    for (const item of document.querySelectorAll(".mobile-nav a")) {
      item.classList.remove("selected");
      item.removeAttribute("aria-current");
    }
    anchor.classList.add("selected");
    anchor.setAttribute("aria-current", "location");
  });
}
loadAll();
