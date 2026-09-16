import { sb } from "./config.js";
import { setState, driverShuttle, driverWatchId } from "./state.js";
import { showToast } from "./utils.js";

/* ============================================================
   DRIVER GPS BROADCAST
   ============================================================ */

export function startDriverBroadcast() {

  if (!driverShuttle) {

    showToast(
      "No shuttle is assigned."
    );

    return;
  }


  if (!navigator.geolocation) {

    showToast(
      "Geolocation is not supported on this device."
    );

    return;
  }


  if (
    driverWatchId !== null
  ) {

    showToast(
      "GPS broadcasting is already active."
    );

    return;
  }


  const button =
    document.getElementById(
      "driver-toggle-btn"
    );

  const statusBox =
    document.getElementById(
      "driver-status"
    );


  button.textContent =
    "⏳ Starting…";

  button.disabled =
    true;


  driverWatchId =
    navigator.geolocation.watchPosition(

      async position => {

        const {
          latitude,
          longitude,
          heading
        } =
          position.coords;


        try {

          /*
            Update Supabase first.

            The UI will only say
            "Broadcasting live" if
            this succeeds.
          */

          const {
            error
          } =
            await sb
              .from("shuttles")
              .update({

                lat:
                  latitude,

                lng:
                  longitude,

                heading:
                  heading ??
                  null,

                is_active:
                  true,

                updated_at:
                  new Date()
                    .toISOString()
              })
              .eq(
                "id",
                driverShuttle.id
              );


          if (error) {

            console.error(
              "GPS database update failed:",
              error
            );


            statusBox.classList
              .remove("live");

            statusBox.classList
              .add("error");


            document.getElementById(
              "driver-gstate"
            ).textContent =
              "Database update failed";


            document.getElementById(
              "driver-gcoords"
            ).textContent =
              error.message;


            button.disabled =
              false;

            button.textContent =
              "📡 Go live";


            return;
          }


          /*
            Database update succeeded.
          */

          driverBroadcasting =
            true;


          statusBox.classList
            .add("live");

          statusBox.classList
            .remove("error");


          document.getElementById(
            "driver-gstate"
          ).textContent =
            "Broadcasting live";


          document.getElementById(
            "driver-gcoords"
          ).textContent =
            `${latitude.toFixed(
              5
            )}, ${longitude.toFixed(
              5
            )}`;


          button.disabled =
            false;

          button.textContent =
            "⏹ Stop broadcasting";

          button.classList
            .add("stop");

        } catch (error) {

          console.error(
            "Unexpected GPS update error:",
            error
          );
        }
      },


      error => {

        console.error(
          "Driver GPS error:",
          error
        );


        driverBroadcasting =
          false;


        statusBox.classList
          .remove("live");

        statusBox.classList
          .add("error");


        document.getElementById(
          "driver-gstate"
        ).textContent =
          "GPS error";


        document.getElementById(
          "driver-gcoords"
        ).textContent =
          error.message;


        button.disabled =
          false;

        button.textContent =
          "📡 Go live";

        button.classList
          .remove("stop");
      },


      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      }
    );
}
