import { setState, map, userMarker, userLatLng, watchId } from "./state.js";
import { showToast } from "./utils.js";
import { renderNearest } from "./nearest.js";

/* ============================================================
   PASSENGER GPS
   ============================================================ */

export function startWatchingLocation() {

  if (!navigator.geolocation) {

    showToast(
      "Geolocation is not supported on this device."
    );

    return;
  }


  if (watchId !== null) {
    return;
  }


  watchId =
    navigator.geolocation.watchPosition(

      position => {

        userLatLng = [
          position.coords.latitude,
          position.coords.longitude
        ];


        if (!userMarker) {

          userMarker =
            L.marker(
              userLatLng,
              {
                icon:
                  L.divIcon({
                    className: "",
                    html:
                      '<div class="user-marker"></div>',
                    iconSize: [16, 16]
                  })
              }
            )
              .addTo(map)
              .bindPopup(
                "You are here"
              );

          map.setView(
            userLatLng,
            16
          );

        } else {

          userMarker.setLatLng(
            userLatLng
          );
        }


        renderNearest();
      },


      error => {

        console.error(
          "Passenger GPS error:",
          error
        );

        const element =
          document.getElementById(
            "nearest-content"
          );

        if (element) {

          element.innerHTML = `
            <div style="
              font-size:13px;
              color:var(--slate);
              padding:8px 0;
            ">
              Location unavailable.
              Enable GPS to find the nearest shuttle.
            </div>
          `;
        }
      },


      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
      }
    );
}


export function stopWatchingLocation() {

  if (watchId !== null) {

    navigator.geolocation.clearWatch(
      watchId
    );

    watchId = null;
  }
}
