import { setState, map, userLatLng, shuttleMarkers } from "./state.js";
import { showToast } from "./utils.js";

/* ============================================================
   MAP
   ============================================================ */

export function initMapIfNeeded() {

  if (map) return;

  map = L.map("map", {
    zoomControl: false,
    attributionControl: true
  })
    .setView(
      [14.3299, 120.9378],
      16
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);
}


export function centerOnUser() {

  if (!map) return;

  if (userLatLng) {

    map.setView(
      userLatLng,
      17,
      { animate: true }
    );

  } else {

    showToast(
      "Waiting for your GPS location…"
    );
  }
}


export function centerOnShuttles() {

  if (!map) return;

  const markers =
    Object.values(shuttleMarkers);

  if (!markers.length) {

    showToast(
      "No active shuttles right now."
    );

    return;
  }

  const group =
    L.featureGroup(markers);

  map.fitBounds(
    group.getBounds().pad(0.3)
  );
}
