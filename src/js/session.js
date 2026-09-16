import { sb } from "./config.js";
import { setState } from "./state.js";
import { showAuthError, showScreen } from "./utils.js";
import { renderProfile } from "./profile.js";
import { initMapIfNeeded } from "./map.js";
import { loadRoutesAndStops } from "./data-routes.js";
import { loadShuttles } from "./data-shuttles.js";
import { subscribeToShuttles } from "./realtime.js";
import { startWatchingLocation } from "./gps.js";
import { renderSchedule } from "./schedule.js";

/* ============================================================
   AUTHENTICATED USER
   ============================================================ */

export async function onAuthenticated(user) {

  currentUser = user;

  const {
    data: profile,
    error
  } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (error) {

    console.error(
      "Profile loading error:",
      error
    );

    showAuthError(
      "Your account profile could not be loaded."
    );

    await sb.auth.signOut();

    currentUser = null;

    return;
  }


  if (!profile) {

    showAuthError(
      "No profile was found for this account."
    );

    return;
  }


  currentProfile = profile;

  renderProfile();

  showScreen("app-screen");

  initMapIfNeeded();

  await loadRoutesAndStops();

  await loadShuttles();

  subscribeToShuttles();

  startWatchingLocation();

  renderSchedule();
}
