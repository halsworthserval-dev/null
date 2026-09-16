import { sb } from "./config.js";
import { setState, map, stopMarkersData } from "./state.js";
import { showToast } from "./utils.js";
import { renderRoutesList } from "./routes.js";
import { renderSchedule } from "./schedule.js";
import { renderRouteChips } from "./filters.js";

/* ============================================================
   LOAD ROUTES + STOPS
   ============================================================ */

export async function loadRoutesAndStops() {

  try {

    const routesResult =
      await sb
        .from("routes")
        .select("*")
        .order("code");


    if (routesResult.error) {

      console.error(
        "Routes error:",
        routesResult.error
      );

      showToast(
        "Failed to load routes."
      );

      return;
    }


    const stopsResult =
      await sb
        .from("stops")
        .select("*")
        .order("sequence");


    if (stopsResult.error) {

      console.error(
        "Stops error:",
        stopsResult.error
      );

      showToast(
        "Failed to load stops."
      );

      return;
    }


    routesCache =
      routesResult.data || [];

    stopsCache =
      stopsResult.data || [];


    /* Remove old stop markers */

    stopMarkersData.forEach(
      ({ marker }) => {

        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    );


    stopMarkersData = [];


    renderRoutesList();
    renderSchedule();
    renderRouteChips();

  } catch (error) {

    console.error(
      "Route loading error:",
      error
    );

    showToast(
      "Could not load route information."
    );
  }
}
