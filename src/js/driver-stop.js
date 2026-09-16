import { sb } from "./config.js";
import { setState, driverShuttle } from "./state.js";
import { showToast } from "./utils.js";

/* ============================================================
   STOP DRIVER BROADCAST
   ============================================================ */

export async function stopDriverBroadcast() {

  if (
    driverWatchId !== null
  ) {

    navigator.geolocation.clearWatch(
      driverWatchId
    );

    driverWatchId =
      null;
  }


  driverBroadcasting =
    false;


  const button =
    document.getElementById(
      "driver-toggle-btn"
    );

  const statusBox =
    document.getElementById(
      "driver-status"
    );


  button.disabled =
    false;

  button.textContent =
    "📡 Go live";

  button.classList
    .remove("stop");


  statusBox.classList
    .remove("live");


  document.getElementById(
    "driver-gstate"
  ).textContent =
    "GPS not active";


  document.getElementById(
    "driver-gcoords"
  ).textContent =
    'Tap "Go live" to start broadcasting';


  if (!driverShuttle) {
    return;
  }


  try {

    const {
      error
    } =
      await sb
        .from("shuttles")
        .update({
          is_active: false
        })
        .eq(
          "id",
          driverShuttle.id
        );


    if (error) {

      console.error(
        "Stop broadcast error:",
        error
      );

      showToast(
        "GPS stopped, but shuttle status could not be updated."
      );

      return;
    }


    showToast(
      "Shuttle is no longer broadcasting."
    );

  } catch (error) {

    console.error(
      "Unexpected stop error:",
      error
    );
  }
}
