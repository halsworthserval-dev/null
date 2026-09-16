/* ============================================================
   UTILITY
   ============================================================ */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add("active");
  }
}


function showAuthError(message) {
  const element = document.getElementById("auth-error");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");
}


function hideAuthError() {
  const element = document.getElementById("auth-error");

  if (element) {
    element.classList.remove("show");
  }
}


function initials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
export function initials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
