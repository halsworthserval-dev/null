import { map } from "./state.js";

/* ============================================================
   TABS
   ============================================================ */

export function switchTab(tab) {

  document
    .querySelectorAll(
      ".tab-panel"
    )
    .forEach(panel => {

      panel.classList.remove(
        "active"
      );
    });


  const target =
    document.getElementById(
      "panel-" + tab
    );


  if (!target) return;


  target.classList.add(
    "active"
  );


  document
    .querySelectorAll(
      ".tabbar-btn"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.tab ===
          tab
      );
    });


  if (
    tab === "home" &&
    map
  ) {

    setTimeout(
      () =>
        map.invalidateSize(),
      50
    );
  }
}
