import { ROUTE_COLORS } from "./config.js";
import { routesCache, stopsCache } from "./state.js";
import { showToast, escapeHTML } from "./utils.js";
import { formatTime } from "./schedule.js";

/* ============================================================
   ROUTES
   ============================================================ */

export function renderRoutesList() {

  const list =
    document.getElementById(
      "routes-list"
    );

  const count =
    document.getElementById(
      "routes-count"
    );


  if (!list) return;


  if (count) {

    count.textContent =
      `${routesCache.length} campus route${
        routesCache.length === 1
          ? ""
          : "s"
      }`;
  }


  if (!routesCache.length) {

    list.innerHTML = `
      <div class="search-empty">
        No routes available.
      </div>
    `;

    return;
  }


  list.innerHTML =
    routesCache
      .map(route => {

        const color =
          ROUTE_COLORS[
            route.code
          ] ||
          "var(--blue-700)";


        return `
          <div
            class="route-card"
            onclick="showRouteDetail('${escapeHTML(route.id)}')"
          >

            <div
              class="route-badge"
              style="background:${color}"
            >
              ${escapeHTML(
                route.code
              )}
            </div>

            <div style="flex:1">

              <div class="rname">
                ${escapeHTML(
                  route.name
                )}
              </div>

              <div class="rfreq">
                ${
                  route.frequency ||
                  "Campus shuttle"
                }
              </div>

            </div>

            <div class="chev">
              ›
            </div>

          </div>
        `;
      })
      .join("");
}


export function showRouteDetail(routeId) {

  const route =
    routesCache.find(
      r =>
        String(r.id) ===
        String(routeId)
    );


  if (!route) {

    showToast(
      "Route not found."
    );

    return;
  }


  const detail =
    document.getElementById(
      "routes-detail-view"
    );

  const list =
    document.getElementById(
      "routes-list-view"
    );


  list.style.display =
    "none";

  detail.style.display =
    "flex";


  document.getElementById(
    "detail-name"
  ).textContent =
    `${route.code} · ${route.name}`;


  document.getElementById(
    "detail-freq"
  ).textContent =
    route.frequency ||
    "Campus shuttle";


  const stops =
    stopsCache
      .filter(
        stop =>
          stop.route_id ===
          route.id
      )
      .sort(
        (a, b) =>
          Number(a.sequence || 0) -
          Number(b.sequence || 0)
      );


  const container =
    document.getElementById(
      "detail-stops"
    );


  if (!stops.length) {

    container.innerHTML = `
      <div class="search-empty">
        No stops are configured
        for this route.
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="stop-list">

      ${stops
        .map(
          (stop, index) => `
            <div class="stop-item">

              <div class="stop-line">

                <div class="stop-dot"></div>

                ${
                  index <
                  stops.length - 1
                    ? `<div class="stop-connector"></div>`
                    : ""
                }

              </div>

              <div class="stop-body">

                <div class="sname">
                  ${escapeHTML(
                    stop.name
                  )}
                </div>

                <div class="stime">
                  ${formatTime(
                    stop.scheduled_time
                  )}
                </div>

              </div>

            </div>
          `
        )
        .join("")}

    </div>
  `;
}


export function showRoutesList() {

  document.getElementById(
    "routes-list-view"
  ).style.display =
    "block";

  document.getElementById(
    "routes-detail-view"
  ).style.display =
    "none";
}
