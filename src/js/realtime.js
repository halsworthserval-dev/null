import { sb } from "./config.js";
import { setState, realtimeChannel, shuttlesCache } from "./state.js";
import { renderShuttleMarkers } from "./markers.js";
import { renderNearest } from "./nearest.js";
import { loadShuttles } from "./data-shuttles.js";

/* ============================================================
   REALTIME SHUTTLES
   ============================================================ */

export function subscribeToShuttles() {

  if (realtimeChannel) {

    sb.removeChannel(
      realtimeChannel
    );

    realtimeChannel = null;
  }


  realtimeChannel =
    sb
      .channel(
        "shuttles-live"
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shuttles"
        },

        payload => {

          handleRealtimeShuttleChange(
            payload
          );
        }
      )

      .subscribe(
        status => {

          console.log(
            "Realtime status:",
            status
          );
        }
      );
}


/*
  Instead of downloading the entire shuttle table
  after EVERY update, update the local cache.
*/

export function handleRealtimeShuttleChange(
  payload
) {

  const newRow =
    payload.new;

  const oldRow =
    payload.old;


  if (payload.eventType === "DELETE") {

    shuttlesCache =
      shuttlesCache.filter(
        shuttle =>
          shuttle.id !== oldRow.id
      );

  } else {

    const index =
      shuttlesCache.findIndex(
        shuttle =>
          shuttle.id === newRow.id
      );


    if (
      newRow.is_active === true
    ) {

      if (index === -1) {

        /*
          Realtime payload may not contain
          the joined route object.
          Reload once when a new shuttle
          appears.
        */

        loadShuttles();

      } else {

        shuttlesCache[index] = {
          ...shuttlesCache[index],
          ...newRow
        };
      }

    } else {

      shuttlesCache =
        shuttlesCache.filter(
          shuttle =>
            shuttle.id !== newRow.id
        );
    }
  }


  renderShuttleMarkers();

  renderNearest();
}
