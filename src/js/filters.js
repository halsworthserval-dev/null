import { ROUTE_COLORS } from "./config.js";
import { activeRouteFilter, routesCache, shuttlesCache, setState } from "./state.js";
import { escapeHTML } from "./utils.js";
import { renderShuttleMarkers } from "./markers.js";
import { renderNearest } from "./nearest.js";

/* ============================================================
   ROUTE FILTER
   ============================================================ */

export function renderRouteChips() {

  const wrapper =
    document.getElementById(
      "route-chip-row"
    );

  if (!wrapper) return;


  const allChip = `
    <button
      class="route-chip ${
        activeRouteFilter === null
          ? "active"
          : ""
      }"
      onclick="setRouteFilter(null)"
    >
      All routes
    </button>
  `;


  const routeChips =
    routesCache
      .map(route => {

        const color =
          ROUTE_COLORS[route.code] ||
          "var(--blue-700)";


        return `
          <button
            class="route-chip ${
              activeRouteFilter === route.id
                ? "active"
                : ""
            }"
            style="--chip-color:${color}"
            onclick="setRouteFilter('${escapeHTML(route.id)}')"
          >
            ${escapeHTML(route.code)}
            ·
            ${escapeHTML(route.name)}
          </button>
        `;
      })
      .join("");


  wrapper.innerHTML =
    allChip + routeChips;
}


export function setRouteFilter(routeId) {

  activeRouteFilter = routeId;

  renderRouteChips();

  renderShuttleMarkers();

  renderNearest();
}


export function visibleShuttles() {

  if (!activeRouteFilter) {
    return shuttlesCache;
  }

  return shuttlesCache.filter(
    shuttle =>
      shuttle.route_id ===
      activeRouteFilter
  );
}
