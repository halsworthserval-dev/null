import { currentProfile, currentUser } from "./state.js";
import { initials } from "./utils.js";

/* ============================================================
   PROFILE
   ============================================================ */

export function renderProfile() {

  const profile = currentProfile;

  if (!profile) return;

  document.getElementById(
    "profile-avatar"
  ).textContent =
    initials(profile.full_name);

  document.getElementById(
    "profile-name"
  ).textContent =
    profile.full_name ||
    "PCU Student";

  document.getElementById(
    "profile-meta"
  ).textContent =
    [
      profile.program,
      profile.student_no
    ]
      .filter(Boolean)
      .join(" · ") ||
    currentUser.email;

  document.getElementById(
    "profile-role"
  ).textContent =
    profile.role === "driver"
      ? "Driver"
      : "Student · Passenger";

  document.getElementById(
    "home-greet"
  ).textContent =
    `Hi ${(profile.full_name || "there")
      .split(" ")[0]}, where to?`;

  document.getElementById(
    "driver-mode-entry"
  ).style.display =
    profile.role === "driver"
      ? "flex"
      : "none";
}
