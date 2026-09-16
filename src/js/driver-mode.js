import { sb } from "./config.js";
import { setState, currentUser, currentProfile } from "./state.js";
import { showToast, showScreen } from "./utils.js";

/* ============================================================
   DRIVER MODE
   ============================================================ */

export async function enterDriverMode() {

  if (
    !currentUser ||
    !currentProfile
  ) {

    showToast(
      "You must be logged in."
    );

    return;
  }


  if (
    currentProfile.role !==
    "driver"
  ) {

    showToast(
      "Only approved driver accounts can use Driver Mode."
    );

    return;
  }


  try {

    /*
      Find a shuttle already assigned
      to this driver.
    */

    const {
      data: shuttle,
      error
    } =
      await sb
        .from("shuttles")
        .select(
          "*, routes(code,name)"
        )
        .eq(
          "driver_id",
          currentUser.id
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Driver shuttle error:",
        error
      );

      showToast(
        "Could not load your assigned shuttle."
      );

      return;
    }


    /*
      IMPORTANT:
      We no longer automatically assign
      the first available shuttle.

      A driver should be assigned a shuttle
      by an administrator.
    */

    if (!shuttle) {

      showToast(
        "No shuttle is assigned to your account. Ask an administrator."
      );

      return;
    }


    driverShuttle =
      shuttle;


    driverSeats =
      Number.isFinite(
        Number(
          shuttle.seats_available
        )
      )
        ? Number(
            shuttle.seats_available
          )
        : Number(
            shuttle.seats_total ||
            0
          );


    document.getElementById(
      "driver-shuttle-label"
    ).textContent =
      shuttle.label ||
      "Assigned Shuttle";


    document.getElementById(
      "driver-route-label"
    ).textContent =
      shuttle.routes
        ? shuttle.routes.name
        : "No route assigned";


    document.getElementById(
      "seat-count"
    ).textContent =
      driverSeats;


    showScreen(
      "driver-screen"
    );

  } catch (error) {

    console.error(
      "Driver mode error:",
      error
    );

    showToast(
      "Could not enter Driver Mode."
    );
  }
}


export function exitDriverMode() {

  if (
    driverBroadcasting
  ) {

    stopDriverBroadcast();
  }

  showScreen(
    "app-screen"
  );
}


export function toggleDriverBroadcast() {

  if (
    driverBroadcasting
  ) {

    stopDriverBroadcast();

  } else {

    startDriverBroadcast();
  }
}
