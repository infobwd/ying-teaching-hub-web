/* Public learning outline only — NO private grades, students or staff schedules. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const selectors = {
    chooser: $("courseChooser"), content: $("courseContent"), loadError: $("mathLoadError"),
    level: $("courseLevel"), title: $("courseTitle"), description: $("courseDescription"),
    hours: $("courseHours"), unit: $("courseUnit"), published: $("publishedCount"),
    list: $("lessonList"), listCount: $("lessonListCount"), selectedHour: $("selectedHour"),
    selectedTitle: $("selectedLessonTitle"), selectedFocus: $("selectedFocus"),
    selectedGuide: $("selectedGuide"), selectedMaterial: $("selectedMaterialStatus"),
    footnote: $("courseFootnote"), previous: $("prevLesson"), next: $("nextLesson"),
    themeToggle: $("themeToggle"), themeIcon: $("themeIcon")
  };
  const selection = { courseId: "m2", hour: 1 };
  let courses = [];

  function setTheme(theme) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    selectors.themeToggle.setAttribute("aria-pressed", String(dark));
    selectors.themeToggle.setAttribute("aria-label", dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
    selectors.themeIcon.textContent = dark ? "☀" : "☾";
    try { localStorage.setItem("ying-theme", dark ? "dark" : "light"); } catch (_) {}
  }
  let saved = null;
  try { saved = localStorage.getItem("ying-theme"); } catch (_) {}
  const preferred = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved === "dark" || saved === "light" ? saved : preferred);
  selectors.themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  // Only plain curriculum outlines can be loaded. This filtering does not make JSON private.
  function validCatalog(catalog) {
    if (!catalog || catalog.schema_version !== 1 || catalog.publication_scope !== "PUBLIC_OUTLINE_ONLY") return false;
    if (!Array.isArray(catalog.courses) || catalog.courses.length !== 2) return false;
    const allowed = new Set(["m2", "m4"]);
    for (const course of catalog.courses) {
      if (!course || !allowed.has(course.id) || !["ม.2", "ม.4"].includes(course.grade)) return false;
      if (typeof course.title !== "string" || typeof course.description !== "string") return false;
      if (!Array.isArray(course.lessons) || course.lessons.length !== course.planned_hours) return false;
      if (course.curriculum_state !== "working_outline" || course.student_files_published !== 0) return false;
      if (!course.lessons.every((lesson, index) =>
        lesson.hour === index + 1 &&
        typeof lesson.title === "string" && lesson.title.trim() &&
        typeof lesson.focus === "string" && lesson.focus.trim() &&
        lesson.material_state === "not_published" && lesson.stage === "planning"
      )) return false;
      allowed.delete(course.id);
    }
    return allowed.size === 0;
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function courseForSelection() {
    return courses.find((course) => course.id === selection.courseId) || courses[0];
  }

  function parseRoute() {
    const match = /^#(m2|m4)-h(\d{1,2})$/.exec(window.location.hash);
    if (!match) return null;
    const course = courses.find((item) => item.id === match[1]);
    const hour = Number(match[2]);
    if (!course || hour < 1 || hour > course.planned_hours) return null;
    return { courseId: course.id, hour };
  }

  function setRoute(courseId, hour, shouldFocus = false, replace = false) {
    const course = courses.find((item) => item.id === courseId);
    if (!course || !Number.isInteger(hour) || hour < 1 || hour > course.lessons.length) return;
    selection.courseId = courseId;
    selection.hour = hour;
    const route = "#" + courseId + "-h" + hour;
    if (window.location.hash !== route) {
      const url = window.location.pathname + window.location.search + route;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    }
    render();
    if (shouldFocus) {
      const title = selectors.selectedTitle;
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
      $("lessonDetail").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function renderLessonButtons(course) {
    selectors.list.replaceChildren();
    for (const lesson of course.lessons) {
      const button = element("button", "lesson-button");
      button.type = "button";
      const selected = lesson.hour === selection.hour;
      button.setAttribute("aria-current", selected ? "step" : "false");
      button.setAttribute("aria-label", "ชั่วโมงที่ " + lesson.hour + " " + lesson.title);
      const number = element("span", "lesson-number", String(lesson.hour).padStart(2, "0"));
      const body = element("span", "lesson-info");
      body.append(element("strong", "", lesson.title));
      body.append(element("small", "", "ยังไม่เปิดเผยแพร่ใบงาน"));
      button.append(number, body, element("span", "lesson-chevron", "›"));
      button.addEventListener("click", () => setRoute(course.id, lesson.hour, true));
      selectors.list.append(button);
    }
  }

  function render() {
    if (!courses.length) return;
    const course = courseForSelection();
    selection.courseId = course.id;
    const lesson = course.lessons.find((item) => item.hour === selection.hour) || course.lessons[0];
    selection.hour = lesson.hour;
    selectors.chooser.querySelectorAll("[data-course]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.course === course.id));
    });
    selectors.level.textContent = course.grade + " · " + course.subject;
    selectors.title.textContent = course.title;
    selectors.description.textContent = course.description;
    selectors.hours.textContent = String(course.planned_hours);
    selectors.unit.textContent = course.unit;
    selectors.published.textContent = "ยังไม่มีชีทเผยแพร่";
    selectors.listCount.textContent = course.lessons.length + " ชั่วโมง";
    selectors.selectedHour.textContent = "ชั่วโมงที่ " + lesson.hour;
    selectors.selectedTitle.textContent = lesson.title;
    selectors.selectedFocus.textContent = lesson.focus;
    selectors.selectedGuide.textContent = lesson.guide || lesson.focus;
    selectors.selectedMaterial.textContent = "ยังไม่มีชีทที่อนุมัติให้เผยแพร่ในชั่วโมงนี้";
    selectors.footnote.textContent = (course.assessment_note ? course.assessment_note + " · " : "") +
      "ผังนี้เป็นโครงเนื้อหาตัวอย่าง ไม่ใช่ตารางสอนที่ยืนยันแล้ว";
    selectors.previous.disabled = lesson.hour === 1;
    selectors.next.disabled = lesson.hour === course.lessons.length;
    renderLessonButtons(course);
  }

  selectors.chooser.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course]");
    if (!button || !selectors.chooser.contains(button) || !courses.length) return;
    setRoute(button.dataset.course, 1);
  });
  selectors.previous.addEventListener("click", () => setRoute(selection.courseId, selection.hour - 1, true));
  selectors.next.addEventListener("click", () => setRoute(selection.courseId, selection.hour + 1, true));
  function restoreHash() {
    if (!courses.length) return;
    const route = parseRoute();
    if (route) {
      selection.courseId = route.courseId;
      selection.hour = route.hour;
    }
    render();
  }
  window.addEventListener("popstate", restoreHash);
  window.addEventListener("hashchange", restoreHash);

  async function loadOutlines() {
    try {
      const response = await fetch("./data/public-math-outline.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to fetch outline");
      const catalog = await response.json();
      if (!validCatalog(catalog)) throw new Error("Invalid outline schema");
      courses = catalog.courses;
      selectors.loadError.hidden = true;
      selectors.content.hidden = false;
      const route = parseRoute();
      if (route) Object.assign(selection, route);
      render();
    } catch (_) {
      selectors.content.hidden = true;
      selectors.loadError.hidden = false;
    }
  }
  loadOutlines();
})();
