import { routesCache, stopsCache, map, stopMarkersData } from "./state.js";
import { showToast, escapeHTML } from "./utils.js";
import { formatTime } from "./schedule.js";
import { switchTab } from "./tabs.js";

/* ============================================================
   STOP SEARCH
   ============================================================ */

export function openStopSearch() {

  const overlay =
    document.getElementById(
      "stop-search-overlay"
    );

  const input =
    document.getElementById(
      "stop-search-input"
    );


  overlay.classList.add(
    "show"
  );

  input.value = "";

  renderStopSearchResults("");

  setTimeout(
    () => input.focus(),
    50
  );
}


export function closeStopSearch() {

  document
    .getElementById(
      "stop-search-overlay"
    )
    .classList.remove(
      "show"
    );
}


export function renderStopSearchResults(
  query
) {

  const list =
    document.getElementById(
      "stop-search-list"
    );


  const q =
    query
      .trim()
      .toLowerCase();


  if (!stopsCache.length) {

    list.innerHTML = `
      <div class="search-empty">
        Stops haven't loaded yet.
      </div>
    `;

    return;
  }


  const matches =
    stopsCache.filter(
      stop =>
        !q ||
        String(stop.name)
          .toLowerCase()
          .includes(q)
    );


  if (!matches.length) {

    list.innerHTML = `
      <div class="search-empty">
        No stops match
        "${escapeHTML(query)}"
      </div>
    `;

    return;
  }


  list.innerHTML =
    matches
      .map(stop => {

        const route =
          routesCache.find(
            r =>
              r.id ===
              stop.route_id
          );


        const color =
          route
            ? (
                ROUTE_COLORS[
                  route.code
                ] ||
                "var(--blue-700)"
              )
            : "var(--slate)";


        return `
          <div
            class="route-card"
            onclick="goToStop('${escapeHTML(stop.id)}')"
          >

            <div
              class="route-badge"
              style="background:${color}"
            >
              ${
                route
                  ? escapeHTML(
                      route.code
                    )
                  : "•"
              }
            </div>

            <div style="flex:1">

              <div class="rname">
                ${escapeHTML(
                  stop.name
                )}
              </div>

              <div class="rfreq">
                ${
                  route
                    ? escapeHTML(
                        route.name
                      )
                    : "Route unavailable"
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


export function goToStop(stopId) {

  const stop =
    stopsCache.find(
      s =>
        String(s.id) ===
        String(stopId)
    );


  if (!stop) {

    showToast(
      "Stop not found."
    );

    return;
  }


  if (
    stop.lat == null ||
    stop.lng == null
  ) {

    showToast(
      "This stop has no map location."
    );

    return;
  }


  closeStopSearch();

  switchTab("home");


  map.setView(
    [
      Number(stop.lat),
      Number(stop.lng)
    ],
    18,
    {
      animate: true
    }
  );


  const stopMarker =
    stopMarkersData.find(
      item =>
        String(
          stopsCache.find(
            s =>
              s.id ===
              item.routeId
          )?.id
        ) ===
        String(stopId)
    );


  /*
    The marker lookup above may not be available
    depending on your route structure.

    Find the closest marker by coordinates instead.
  */

  const marker =
    stopMarkersData.find(
      item => {

        const position =
          item.marker.getLatLng();

        return (
          Math.abs(
            position.lat -
              Number(stop.lat)
          ) < 0.000001 &&
          Math.abs(
            position.lng -
              Number(stop.lng)
          ) < 0.000001
        );
      }
    );


  if (marker) {
    marker.marker.openPopup();
  }
}
