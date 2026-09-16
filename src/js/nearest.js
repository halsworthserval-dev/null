import { activeRouteFilter, userLatLng } from "./state.js";
import { showToast, escapeHTML } from "./utils.js";
import { visibleShuttles } from "./filters.js";
import { haversine } from "./geo.js";

/* ============================================================
   NEAREST SHUTTLE
   ============================================================ */

export function renderNearest() {

  const element =
    document.getElementById(
      "nearest-content"
    );

  if (!element) return;


  const pool =
    visibleShuttles();


  if (!pool.length) {

    element.innerHTML = `
      <div style="
        font-size:13px;
        color:var(--slate);
        padding:8px 0;
      ">
        ${
          activeRouteFilter
            ? "No active shuttles on this route right now."
            : "No active shuttles right now."
        }
      </div>
    `;

    return;
  }


  let nearest =
    pool[0];

  let distance =
    null;


  if (userLatLng) {

    let best =
      Infinity;

    pool.forEach(
      shuttle => {

        if (
          shuttle.lat == null ||
          shuttle.lng == null
        ) {
          return;
        }


        const d =
          haversine(
            userLatLng[0],
            userLatLng[1],
            Number(shuttle.lat),
            Number(shuttle.lng)
          );


        if (d < best) {

          best = d;

          nearest =
            shuttle;
        }
      }
    );


    if (
      best !== Infinity
    ) {
      distance = best;
    }
  }


  /*
    Prototype ETA only.

    Assumes approximately 22 km/h.
    This is NOT road-routing ETA.
  */

  const etaMin =
    distance !== null
      ? Math.max(
          1,
          Math.round(
            distance /
              1000 /
              22 *
              60
          )
        )
      : null;


  const seats =
    Number(
      nearest.seats_available
    );


  const low =
    Number.isFinite(seats) &&
    seats <= 3;


  element.innerHTML = `
    <div class="shuttle-row">

      <div class="shuttle-icon">
        🚌
        <div class="live-dot"></div>
      </div>

      <div class="shuttle-info">

        <div class="name">
          ${escapeHTML(
            nearest.label
          )}
        </div>

        <div class="meta">
          ${
            nearest.routes
              ? escapeHTML(
                  nearest.routes.name
                )
              : "Route unassigned"
          }
        </div>

        <div class="seats-pill ${
          low ? "low" : ""
        }">

          ${
            Number.isFinite(seats)
              ? `${seats} seats left`
              : "Seat count unavailable"
          }

        </div>

      </div>

      <div class="shuttle-eta">

        <div class="big">
          ${
            etaMin !== null
              ? etaMin
              : "–"
          }
        </div>

        <div class="lbl">
          ${
            etaMin !== null
              ? "min away"
              : "LIVE"
          }
        </div>

      </div>

    </div>
  `;
}
