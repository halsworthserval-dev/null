import { sb } from "./config.js";
import { setState } from "./state.js";
import { showToast } from "./utils.js";
import { renderShuttleMarkers } from "./markers.js";
import { renderNearest } from "./nearest.js";

/* ============================================================
   LOAD SHUTTLES
   ============================================================ */

export async function loadShuttles() {

  try {

    const {
      data,
      error
    } = await sb
      .from("shuttles")
      .select(
        "*, routes(code,name)"
      )
      .eq(
        "is_active",
        true
      );


    if (error) {

      console.error(
        "Shuttle loading error:",
        error
      );

      showToast(
        "Failed to load shuttle locations."
      );

      return;
    }


    shuttlesCache = data || [];

    renderShuttleMarkers();

    renderNearest();

  } catch (error) {

    console.error(
      "Unexpected shuttle error:",
      error
    );
  }
}
