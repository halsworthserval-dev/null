import { sb } from "./config.js";
import { setState } from "./state.js";
import { checkExistingSession } from "./session.js";
import { switchAuthTab, setRole, handleLogin, handleRegister, handleForgotPassword } from "./auth.js";
import { handleLogout } from "./logout.js";
import { centerOnUser, centerOnShuttles } from "./map.js";
import { openStopSearch, closeStopSearch, renderStopSearchResults, goToStop } from "./search.js";
import { renderRouteChips, setRouteFilter } from "./filters.js";
import { renderRoutesList, showRouteDetail, showRoutesList } from "./routes.js";
import { selectDay } from "./schedule.js";
import { switchTab } from "./tabs.js";
import { enterDriverMode, exitDriverMode, toggleDriverBroadcast } from "./driver-mode.js";
import { startDriverBroadcast } from "./driver-gps.js";
import { stopDriverBroadcast } from "./driver-stop.js";
import { adjustSeats } from "./driver-seats.js";

Object.assign(window, {
  switchAuthTab, setRole, handleLogin, handleRegister, handleForgotPassword,
  handleLogout, centerOnUser, centerOnShuttles, openStopSearch, closeStopSearch,
  renderStopSearchResults, goToStop, renderRouteChips, setRouteFilter,
  renderRoutesList, showRouteDetail, showRoutesList, selectDay, switchTab,
  enterDriverMode, exitDriverMode, toggleDriverBroadcast, startDriverBroadcast,
  stopDriverBroadcast, adjustSeats
});

sb.auth.onAuthStateChange(async (event) => {
  console.log("Auth event:", event);
  if (event === "SIGNED_OUT") {
    setState.currentUser(null);
    setState.currentProfile(null);
    document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
    document.getElementById("auth-screen")?.classList.add("active");
  }
});

checkExistingSession();
