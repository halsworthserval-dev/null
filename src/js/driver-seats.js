import { sb } from "./config.js";
import { setState, driverShuttle, driverSeats } from "./state.js";
import { showToast } from "./utils.js";

/* ============================================================
   DRIVER SEATS
   ============================================================ */

export async function adjustSeats(delta) {

  if (!driverShuttle) {

    showToast(
      "No shuttle is assigned."
    );

    return;
  }


  const total =
    Number(
      driverShuttle.seats_total
    );


  if (!Number.isFinite(total)) {

    showToast(
      "Invalid shuttle capacity."
    );

    return;
  }


  const newSeats =
    Math.max(
      0,
      Math.min(
        total,
        driverSeats +
          delta
      )
    );


  if (
    newSeats ===
    driverSeats
  ) {

    return;
  }


  /*
    Update database first.
  */

  const {
    error
  } =
    await sb
      .from("shuttles")
      .update({
        seats_available:
          newSeats
      })
      .eq(
        "id",
        driverShuttle.id
      );


  if (error) {

    console.error(
      "Seat update error:",
      error
    );

    showToast(
      "Could not update seat count."
    );

    return;
  }


  /*
    Update local state only
    after successful database update.
  */

  driverSeats =
    newSeats;

  driverShuttle.seats_available =
    newSeats;


  document.getElementById(
    "seat-count"
  ).textContent =
    newSeats;


  showToast(
    `Seats available: ${newSeats}`
  );
}
