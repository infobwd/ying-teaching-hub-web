/* Ying Teaching Hub — public-only MVP. This browser never requests private student/teacher records. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const nodes = {
    themeToggle: $("themeToggle"), themeIcon: $("themeIcon"),
    publicCount: $("publicCount"), catalogCount: $("catalogCount"),
    searchInput: $("searchInput"), workspaceFilter: $("workspaceFilter"),
    levelFilter: $("levelFilter"), catalogMessage: $("catalogMessage"),
    materialGrid: $("materialGrid"), emptyState: $("emptyState"),
    emptyTitle: $("emptyTitle"), emptyDescription: $("emptyDescription"),
    resetFilters: $("resetFilters")
  };
  let approvedMaterials = [];
  let catalogUnavailable = false;

  function setTheme(theme) {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    nodes.themeToggle.setAttribute("aria-pressed", String(dark));
    nodes.themeToggle.setAttribute("aria-label", dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
    nodes.themeIcon.textContent = dark ? "☀" : "☾";
    try { localStorage.setItem("ying-theme", dark ? "dark" : "light"); } catch (_) {}
  }
  let saved = null;
  try { saved = localStorage.getItem("ying-theme"); } catch (_) {}
  const preferred = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved === "dark" || saved === "light" ? saved : preferred);
  nodes.themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  // Defensive rendering is not a security boundary. The JSON file itself MUST contain only approved public records.
  function validMaterial(item) {
    if (!item || typeof item !== "object") return false;
    const required = ["id", "title", "description", "level", "subject", "version", "file_url", "approved_at"];
    if (!required.every((k) => typeof item[k] === "string" && item[k].trim())) return false;
    if (!["school", "tutoring"].includes(item.workspace_type)) return false;
    if (item.visibility !== "PUBLIC_APPROVED" || item.approval_status !== "approved" || item.publication_state !== "published") return false;
    try {
      const url = new URL(item.file_url);
      if (url.protocol !== "https:") return false;
    } catch (_) { return false; }
    return true;
  }

  const el = (tag, className, value) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (value !== undefined) result.textContent = value;
    return result;
  };

  function renderCard(item) {
    const article = el("article", "material-card");
    const category = item.workspace_type === "school" ? "งานสอนประจำ" : "งานสอนพิเศษ";
    article.append(el("span", "material-category", category));
    article.append(el("h3", "", item.title));
    article.append(el("p", "", item.description));

    const details = el("div", "details");
    details.append(el("span", "", item.level + " · " + item.subject));
    details.append(el("span", "", "ฉบับ " + item.version));
    article.append(details);

    const link = el("a", "", "เปิดสื่อที่อนุมัติ ↗");
    link.href = item.file_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "เปิดสื่อ " + item.title + " ในแท็บใหม่");
    article.append(link);
    return article;
  }

  function rebuildLevels() {
    const levels = [...new Set(approvedMaterials.map((x) => x.level))].sort((a, b) => a.localeCompare(b, "th"));
    nodes.levelFilter.replaceChildren(new Option("ทุกระดับชั้น", "all"));
    levels.forEach((level) => nodes.levelFilter.add(new Option(level, level)));
  }

  function clearFilters() {
    nodes.searchInput.value = "";
    nodes.workspaceFilter.value = "all";
    nodes.levelFilter.value = "all";
    renderCatalog();
  }

  function renderCatalog() {
    const text = nodes.searchInput.value.trim().toLocaleLowerCase("th");
    const workspace = nodes.workspaceFilter.value;
    const level = nodes.levelFilter.value;
    const filtered = approvedMaterials.filter((item) => {
      const matchesText = [item.title, item.description, item.subject, item.level].some((v) => v.toLocaleLowerCase("th").includes(text));
      return matchesText && (workspace === "all" || item.workspace_type === workspace) && (level === "all" || item.level === level);
    });

    nodes.materialGrid.replaceChildren(...filtered.map(renderCard));
    nodes.emptyState.hidden = filtered.length > 0;
    const hasFilters = Boolean(text) || workspace !== "all" || level !== "all";
    nodes.resetFilters.hidden = !hasFilters;

    if (catalogUnavailable) {
      nodes.emptyTitle.textContent = "ไม่สามารถโหลดคลังสื่อได้";
      nodes.emptyDescription.textContent = "กรุณาตรวจสอบการเชื่อมต่อแล้วเปิดหน้าเว็บใหม่อีกครั้ง";
      nodes.catalogMessage.textContent = "โหลดข้อมูลไม่สำเร็จ";
    } else if (!approvedMaterials.length) {
      nodes.emptyTitle.textContent = "กำลังเตรียมคลังสื่อ";
      nodes.emptyDescription.textContent = "ยังไม่มีสื่อที่อนุมัติให้เผยแพร่ในขณะนี้ เมื่อมีเอกสารที่ผ่านการตรวจแล้ว จะปรากฏที่นี่";
      nodes.catalogMessage.textContent = "ยังไม่มีสื่อสาธารณะที่เผยแพร่";
    } else if (!filtered.length) {
      nodes.emptyTitle.textContent = "ไม่พบสื่อที่ตรงกับคำค้น";
      nodes.emptyDescription.textContent = "ลองเปลี่ยนคำค้น หรือเลือกประเภทงานสอนและระดับชั้นใหม่";
      nodes.catalogMessage.textContent = "พบ 0 จาก " + approvedMaterials.length + " รายการ";
    } else {
      nodes.catalogMessage.textContent = "กำลังแสดง " + filtered.length + " จาก " + approvedMaterials.length + " รายการที่อนุมัติแล้ว";
    }
    nodes.publicCount.textContent = String(approvedMaterials.length);
    nodes.catalogCount.textContent = approvedMaterials.length + " รายการที่เผยแพร่แล้ว";
  }

  nodes.searchInput.addEventListener("input", renderCatalog);
  nodes.workspaceFilter.addEventListener("change", renderCatalog);
  nodes.levelFilter.addEventListener("change", renderCatalog);
  nodes.resetFilters.addEventListener("click", clearFilters);

  async function loadPublicMaterials() {
    try {
      const res = await fetch("./data/public-materials.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Catalog request failed");
      const catalog = await res.json();
      if (!catalog || catalog.schema_version !== 1 || !Array.isArray(catalog.materials)) throw new Error("Catalog schema invalid");
      approvedMaterials = catalog.materials.filter(validMaterial);
      if (approvedMaterials.length !== catalog.materials.length) {
        // Refuse to render records whose publication flags or fields are invalid.
        console.warn("Some public catalog records are invalid. Remove them at source before publishing.");
      }
      catalogUnavailable = false;
    } catch (err) {
      approvedMaterials = [];
      catalogUnavailable = true;
      console.warn("Unable to load public catalog.");
    }
    rebuildLevels();
    renderCatalog();
  }
  loadPublicMaterials();
})();
