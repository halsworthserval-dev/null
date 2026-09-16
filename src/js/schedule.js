import { ROUTE_COLORS } from "./config.js";
import { routesCache, stopsCache, selectedDay, setState } from "./state.js";
import { escapeHTML } from "./utils.js";

/* ============================================================
   SCHEDULE
   ============================================================ */

export function renderSchedule() {

  const tabs =
    document.getElementById(
      "day-tabs"
    );

  const content =
    document.getElementById(
      "schedule-content"
    );


  if (!tabs || !content) return;


  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];


  tabs.innerHTML =
    days
      .map(
        (day, index) => `
          <button
            class="day-tab ${
              selectedDay === index
                ? "active"
                : ""
            }"
            onclick="selectDay(${index})"
          >
            ${day.slice(0, 3)}
          </button>
        `
      )
      .join("");


  if (!routesCache.length) {

    content.innerHTML = `
      <div class="loading-fill">
        <div class="spinner"></div>
        Loading schedule…
      </div>
    `;

    return;
  }


  content.innerHTML =
    routesCache
      .map(route => {

        const stops =
          stopsCache
            .filter(
              stop =>
                stop.route_id ===
                route.id
            )
            .sort(
              (a, b) =>
                Number(
                  a.sequence || 0
                ) -
                Number(
                  b.sequence || 0
                )
            );


        return `
          <div class="sched-route-group">

            <div class="sched-route-title">

              <span
                class="dot"
                style="
                  background:${
                    ROUTE_COLORS[
                      route.code
                    ] ||
                    "var(--blue-700)"
                  }
                "
              ></span>

              ${escapeHTML(
                route.code
              )}
              ·
              ${escapeHTML(
                route.name
              )}

            </div>


            <div class="sched-grid">

              ${
                stops.length
                  ? stops
                      .map(
                        stop => `
                          <div class="sched-grid-row">

                            <span class="stop-name">
                              ${escapeHTML(
                                stop.name
                              )}
                            </span>

                            <span class="stop-time">
                              ${formatTime(
                                stop.scheduled_time
                              )}
                            </span>

                          </div>
                        `
                      )
                      .join("")
                  : `
                    <div class="sched-grid-row">
                      <span class="stop-name">
                        No stops configured
                      </span>
                    </div>
                  `
              }

            </div>

          </div>
        `;
      })
      .join("");
}


export function selectDay(day) {

  selectedDay =
    day;

  renderSchedule();
}


export function formatTime(time) {

  if (!time) {
    return "–";
  }


  const parts =
    String(time)
      .split(":")
      .map(Number);


  const hour =
    parts[0];

  const minute =
    parts[1] || 0;


  const period =
    hour >= 12
      ? "PM"
      : "AM";


  const hour12 =
    hour % 12 === 0
      ? 12
      : hour % 12;


  return `
    ${hour12}:${String(
      minute
    ).padStart(2, "0")} ${period}
  `;
}
