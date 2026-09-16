import { sb } from "./config.js";
import { setState, realtimeChannel, driverBroadcasting } from "./state.js";
import { showToast, showScreen } from "./utils.js";
import { stopWatchingLocation } from "./gps.js";
import { stopDriverBroadcast } from "./driver-stop.js";

/* ============================================================
   LOGOUT
   ============================================================ */

export async function handleLogout() {

  try {

    stopWatchingLocation();

    if (driverBroadcasting) {
      await stopDriverBroadcast();
    }

    if (realtimeChannel) {

      await sb.removeChannel(
        realtimeChannel
      );

      realtimeChannel = null;
    }

    const {
      error
    } = await sb.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error
      );

      showToast(
        "Could not log out."
      );

      return;
    }

    currentUser = null;
    currentProfile = null;

    showScreen("auth-screen");

  } catch (error) {

    console.error(
      "Unexpected logout error:",
      error
    );
  }
}
