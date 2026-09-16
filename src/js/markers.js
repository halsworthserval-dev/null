import { ROUTE_COLORS } from "./config.js";
import { map, shuttleMarkers, stopMarkersData, stopsCache, activeRouteFilter } from "./state.js";
import { escapeHTML } from "./utils.js";
import { formatTime } from "./schedule.js";

/* ============================================================
   SHUTTLE MARKERS
   ============================================================ */

export function renderShuttleMarkers() {

  if (!map) return;


  const visible =
    visibleShuttles();


  const visibleIds =
    new Set(
      visible.map(
        shuttle => String(shuttle.id)
      )
    );


  /* Remove invisible markers */

  Object.keys(
    shuttleMarkers
  ).forEach(id => {

    if (
      !visibleIds.has(id)
    ) {

      if (
        map.hasLayer(
          shuttleMarkers[id]
        )
      ) {

        map.removeLayer(
          shuttleMarkers[id]
        );
      }

      delete shuttleMarkers[id];
    }
  });


  /* Create/update markers */

  visible.forEach(
    shuttle => {

      if (
        shuttle.lat == null ||
        shuttle.lng == null
      ) {
        return;
      }


      const id =
        String(shuttle.id);


      const popupHTML = `
        <strong>
          ${escapeHTML(shuttle.label)}
        </strong>
        <br>
        ${
          Number.isFinite(
            shuttle.seats_available
          )
            ? `${shuttle.seats_available} seats left`
            : "Seat count unavailable"
        }
      `;


      if (
        shuttleMarkers[id]
      ) {

        const marker =
          shuttleMarkers[id];


        marker.setLatLng([
          Number(shuttle.lat),
          Number(shuttle.lng)
        ]);


        marker.setPopupContent(
          popupHTML
        );

      } else {

        const marker =
          L.marker(
            [
              Number(shuttle.lat),
              Number(shuttle.lng)
            ],
            {
              icon:
                L.divIcon({
                  className: "",
                  html:
                    `
                    <div class="shuttle-marker-pulse">
                      <div class="shuttle-arrow"></div>
                    </div>
                    `,
                  iconSize: [
                    22,
                    22
                  ]
                })
            }
          )
            .addTo(map)
            .bindPopup(
              popupHTML
            );


        shuttleMarkers[id] =
          marker;
      }
    }
  );


  /* Stop markers */

  if (
    stopMarkersData.length === 0 &&
    stopsCache.length
  ) {

    stopsCache.forEach(
      stop => {

        if (
          stop.lat == null ||
          stop.lng == null
        ) {
          return;
        }


        const marker =
          L.marker(
            [
              Number(stop.lat),
              Number(stop.lng)
            ],
            {
              icon:
                L.divIcon({
                  className: "",
                  html:
                    '<div class="stop-marker"></div>',
                  iconSize: [
                    10,
                    10
                  ]
                })
            }
          )
            .bindPopup(
              `
              <strong>
                ${escapeHTML(stop.name)}
              </strong>
              <br>
              Scheduled:
              ${formatTime(
                stop.scheduled_time
              )}
              `
            );


        stopMarkersData.push({
          routeId:
            stop.route_id,

          marker
        });
      }
    );
  }


  updateStopMarkersVisibility();
}


export function updateStopMarkersVisibility() {

  if (!map) return;


  stopMarkersData.forEach(
    ({
      routeId,
      marker
    }) => {

      const shouldShow =
        !activeRouteFilter ||
        routeId ===
          activeRouteFilter;


      const onMap =
        map.hasLayer(marker);


      if (
        shouldShow &&
        !onMap
      ) {
        marker.addTo(map);
      }


      if (
        !shouldShow &&
        onMap
      ) {
        map.removeLayer(marker);
      }
    }
  );
}
