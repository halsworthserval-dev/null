/*
 * Reference snapshot of the original uploaded monolithic script.
 * The modular source under src/js/ is the active organization.
 */
/* ============================================================
   PCU SHUTTLENUBNAV — IMPROVED SUPABASE BUILD
   ============================================================ */

/* ---------------- SUPABASE ---------------- */

const SUPABASE_URL =
  "https://zagtzosyqdeigffpdtym.supabase.co";

const SUPABASE_ANON_KEY =
  "YOUR_SUPABASE_ANON_KEY";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* ---------------- GLOBAL STATE ---------------- */

let currentUser = null;
let currentProfile = null;

let map = null;
let userMarker = null;

let shuttleMarkers = {};
let stopMarkersData = [];

let routesCache = [];
let stopsCache = [];
let shuttlesCache = [];

let realtimeChannel = null;

let userLatLng = null;
let watchId = null;

let driverBroadcasting = false;
let driverShuttle = null;
let driverSeats = 0;
let driverWatchId = null;

let activeRouteFilter = null;
let selectedRole = "passenger";
let selectedDay = new Date().getDay();


/* ---------------- ROUTE COLORS ---------------- */

const ROUTE_COLORS = {
  A: "#0b4ea2",
  B: "#1a9e5c",
  C: "#f2a900"
};


/* ============================================================
   UTILITY
   ============================================================ */

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.add("active");
  }
}


function showAuthError(message) {
  const element = document.getElementById("auth-error");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");
}


function hideAuthError() {
  const element = document.getElementById("auth-error");

  if (element) {
    element.classList.remove("show");
  }
}


function initials(name) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join("");
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ============================================================
   AUTH
   ============================================================ */

function switchAuthTab(tab) {
  document
    .getElementById("tab-login")
    ?.classList.toggle("active", tab === "login");

  document
    .getElementById("tab-register")
    ?.classList.toggle("active", tab === "register");

  document.getElementById("login-form").style.display =
    tab === "login" ? "block" : "none";

  document.getElementById("register-form").style.display =
    tab === "register" ? "block" : "none";

  hideAuthError();
}


function setRole(role) {
  selectedRole = role;

  document
    .getElementById("role-passenger")
    ?.classList.toggle("active", role === "passenger");

  document
    .getElementById("role-driver")
    ?.classList.toggle("active", role === "driver");
}


/* ---------------- LOGIN ---------------- */

async function handleLogin(event) {
  event.preventDefault();

  hideAuthError();

  const button = document.getElementById("login-btn");

  button.disabled = true;
  button.textContent = "Logging in…";

  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;

  try {
    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("Login error:", error);

      showAuthError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Try again."
          : error.message
      );

      return;
    }

    if (!data?.user) {
      showAuthError("Login succeeded but no user was returned.");
      return;
    }

    await onAuthenticated(data.user);

  } catch (error) {
    console.error("Unexpected login error:", error);
    showAuthError("Something went wrong while logging in.");
  } finally {
    button.disabled = false;
    button.textContent = "Log in";
  }
}


/* ---------------- REGISTER ---------------- */

async function handleRegister(event) {
  event.preventDefault();

  hideAuthError();

  const button = document.getElementById("register-btn");

  button.disabled = true;
  button.textContent = "Creating account…";

  const name =
    document.getElementById("reg-name").value.trim();

  const studentNo =
    document.getElementById("reg-studentno").value.trim();

  const program =
    document.getElementById("reg-program").value.trim();

  const email =
    document.getElementById("reg-email").value.trim();

  const password =
    document.getElementById("reg-password").value;

  try {

    /* Create authentication account */

    const { data, error } =
      await sb.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name
          }
        }
      });

    if (error) {
      console.error("Registration error:", error);
      showAuthError(error.message);
      return;
    }

    if (!data?.user) {
      showAuthError("Account could not be created.");
      return;
    }


    /*
      IMPORTANT:

      This code assumes your database has a trigger that
      automatically creates a profiles row.

      If you DO NOT have that trigger, see the SQL section
      below this code.
    */


    /*
      If the user is immediately authenticated,
      update the profile.
    */

    if (data.session) {

      const { error: profileError } =
        await sb
          .from("profiles")
          .update({
            full_name: name,
            student_no: studentNo || null,
            program: program || null,
            role: selectedRole
          })
          .eq("id", data.user.id);

      if (profileError) {
        console.error(
          "Profile update error:",
          profileError
        );

        showAuthError(
          "Account created, but your profile could not be saved."
        );

        return;
      }

      await onAuthenticated(data.user);

    } else {

      showToast(
        "Account created. Check your email to confirm your account."
      );

      switchAuthTab("login");
    }

  } catch (error) {

    console.error(
      "Unexpected registration error:",
      error
    );

    showAuthError(
      "Something went wrong while creating the account."
    );

  } finally {

    button.disabled = false;
    button.textContent = "Create account";
  }
}


/* ---------------- PASSWORD RESET ---------------- */

async function handleForgotPassword() {

  hideAuthError();

  const email =
    document.getElementById("login-email").value.trim();

  if (!email) {
    showAuthError(
      "Enter your email first, then tap Forgot password."
    );

    return;
  }

  const link =
    document.querySelector(".forgot-link");

  const previousText = link.textContent;

  link.textContent = "Sending…";

  try {

    const { error } =
      await sb.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.href
        }
      );

    if (error) {
      console.error(
        "Password reset error:",
        error
      );

      showAuthError(error.message);
      return;
    }

    showToast(
      `Password reset link sent to ${email}`
    );

  } finally {

    link.textContent = previousText;
  }
}


/* ============================================================
   AUTHENTICATED USER
   ============================================================ */

async function onAuthenticated(user) {

  currentUser = user;

  const {
    data: profile,
    error
  } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();


  if (error) {

    console.error(
      "Profile loading error:",
      error
    );

    showAuthError(
      "Your account profile could not be loaded."
    );

    await sb.auth.signOut();

    currentUser = null;

    return;
  }


  if (!profile) {

    showAuthError(
      "No profile was found for this account."
    );

    return;
  }


  currentProfile = profile;

  renderProfile();

  showScreen("app-screen");

  initMapIfNeeded();

  await loadRoutesAndStops();

  await loadShuttles();

  subscribeToShuttles();

  startWatchingLocation();

  renderSchedule();
}


/* ============================================================
   SESSION
   ============================================================ */

async function checkExistingSession() {

  try {

    const {
      data,
      error
    } = await sb.auth.getSession();

    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;
    }

    if (data?.session?.user) {

      await onAuthenticated(
        data.session.user
      );
    }

  } catch (error) {

    console.error(
      "Unexpected session error:",
      error
    );
  }
}


/* Listen for authentication changes */

sb.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );

    if (event === "SIGNED_OUT") {

      currentUser = null;
      currentProfile = null;

      showScreen("auth-screen");
    }

  }
);


/* ============================================================
   LOGOUT
   ============================================================ */

async function handleLogout() {

  try {

    stopWatchingLocation();

    if (driverBroadcasting) {
      await stopDriverBroadcast();
    }

    if (realtimeChannel) {

      await sb.removeChannel(
        realtimeChannel
      );

      realtimeChannel = null;
    }

    const {
      error
    } = await sb.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error
      );

      showToast(
        "Could not log out."
      );

      return;
    }

    currentUser = null;
    currentProfile = null;

    showScreen("auth-screen");

  } catch (error) {

    console.error(
      "Unexpected logout error:",
      error
    );
  }
}


/* ============================================================
   PROFILE
   ============================================================ */

function renderProfile() {

  const profile = currentProfile;

  if (!profile) return;

  document.getElementById(
    "profile-avatar"
  ).textContent =
    initials(profile.full_name);

  document.getElementById(
    "profile-name"
  ).textContent =
    profile.full_name ||
    "PCU Student";

  document.getElementById(
    "profile-meta"
  ).textContent =
    [
      profile.program,
      profile.student_no
    ]
      .filter(Boolean)
      .join(" · ") ||
    currentUser.email;

  document.getElementById(
    "profile-role"
  ).textContent =
    profile.role === "driver"
      ? "Driver"
      : "Student · Passenger";

  document.getElementById(
    "home-greet"
  ).textContent =
    `Hi ${(profile.full_name || "there")
      .split(" ")[0]}, where to?`;

  document.getElementById(
    "driver-mode-entry"
  ).style.display =
    profile.role === "driver"
      ? "flex"
      : "none";
}


/* ============================================================
   MAP
   ============================================================ */

function initMapIfNeeded() {

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


function centerOnUser() {

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


function centerOnShuttles() {

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


/* ============================================================
   PASSENGER GPS
   ============================================================ */

function startWatchingLocation() {

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


function stopWatchingLocation() {

  if (watchId !== null) {

    navigator.geolocation.clearWatch(
      watchId
    );

    watchId = null;
  }
}


/* ============================================================
   LOAD ROUTES + STOPS
   ============================================================ */

async function loadRoutesAndStops() {

  try {

    const routesResult =
      await sb
        .from("routes")
        .select("*")
        .order("code");


    if (routesResult.error) {

      console.error(
        "Routes error:",
        routesResult.error
      );

      showToast(
        "Failed to load routes."
      );

      return;
    }


    const stopsResult =
      await sb
        .from("stops")
        .select("*")
        .order("sequence");


    if (stopsResult.error) {

      console.error(
        "Stops error:",
        stopsResult.error
      );

      showToast(
        "Failed to load stops."
      );

      return;
    }


    routesCache =
      routesResult.data || [];

    stopsCache =
      stopsResult.data || [];


    /* Remove old stop markers */

    stopMarkersData.forEach(
      ({ marker }) => {

        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    );


    stopMarkersData = [];


    renderRoutesList();
    renderSchedule();
    renderRouteChips();

  } catch (error) {

    console.error(
      "Route loading error:",
      error
    );

    showToast(
      "Could not load route information."
    );
  }
}


/* ============================================================
   LOAD SHUTTLES
   ============================================================ */

async function loadShuttles() {

  try {

    const {
      data,
      error
    } = await sb
      .from("shuttles")
      .select(
        "*, routes(code,name)"
      )
      .eq(
        "is_active",
        true
      );


    if (error) {

      console.error(
        "Shuttle loading error:",
        error
      );

      showToast(
        "Failed to load shuttle locations."
      );

      return;
    }


    shuttlesCache = data || [];

    renderShuttleMarkers();

    renderNearest();

  } catch (error) {

    console.error(
      "Unexpected shuttle error:",
      error
    );
  }
}


/* ============================================================
   ROUTE FILTER
   ============================================================ */

function renderRouteChips() {

  const wrapper =
    document.getElementById(
      "route-chip-row"
    );

  if (!wrapper) return;


  const allChip = `
    <button
      class="route-chip ${
        activeRouteFilter === null
          ? "active"
          : ""
      }"
      onclick="setRouteFilter(null)"
    >
      All routes
    </button>
  `;


  const routeChips =
    routesCache
      .map(route => {

        const color =
          ROUTE_COLORS[route.code] ||
          "var(--blue-700)";


        return `
          <button
            class="route-chip ${
              activeRouteFilter === route.id
                ? "active"
                : ""
            }"
            style="--chip-color:${color}"
            onclick="setRouteFilter('${escapeHTML(route.id)}')"
          >
            ${escapeHTML(route.code)}
            ·
            ${escapeHTML(route.name)}
          </button>
        `;
      })
      .join("");


  wrapper.innerHTML =
    allChip + routeChips;
}


function setRouteFilter(routeId) {

  activeRouteFilter = routeId;

  renderRouteChips();

  renderShuttleMarkers();

  renderNearest();
}


function visibleShuttles() {

  if (!activeRouteFilter) {
    return shuttlesCache;
  }

  return shuttlesCache.filter(
    shuttle =>
      shuttle.route_id ===
      activeRouteFilter
  );
}


/* ============================================================
   REALTIME SHUTTLES
   ============================================================ */

function subscribeToShuttles() {

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

function handleRealtimeShuttleChange(
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


/* ============================================================
   SHUTTLE MARKERS
   ============================================================ */

function renderShuttleMarkers() {

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


function updateStopMarkersVisibility() {

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


/* ============================================================
   DISTANCE / ETA
   ============================================================ */

function haversine(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371000;

  const toRad =
    degrees =>
      degrees *
      Math.PI /
      180;


  const dLat =
    toRad(lat2 - lat1);

  const dLon =
    toRad(lon2 - lon1);


  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;


  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}


/* ============================================================
   NEAREST SHUTTLE
   ============================================================ */

function renderNearest() {

  const element =
    document.getElementById(
      "nearest-content"
    );

  if (!element) return;


  const pool =
    visibleShuttles();


  if (!pool.length) {

    element.innerHTML = `
      <div style="
        font-size:13px;
        color:var(--slate);
        padding:8px 0;
      ">
        ${
          activeRouteFilter
            ? "No active shuttles on this route right now."
            : "No active shuttles right now."
        }
      </div>
    `;

    return;
  }


  let nearest =
    pool[0];

  let distance =
    null;


  if (userLatLng) {

    let best =
      Infinity;

    pool.forEach(
      shuttle => {

        if (
          shuttle.lat == null ||
          shuttle.lng == null
        ) {
          return;
        }


        const d =
          haversine(
            userLatLng[0],
            userLatLng[1],
            Number(shuttle.lat),
            Number(shuttle.lng)
          );


        if (d < best) {

          best = d;

          nearest =
            shuttle;
        }
      }
    );


    if (
      best !== Infinity
    ) {
      distance = best;
    }
  }


  /*
    Prototype ETA only.

    Assumes approximately 22 km/h.
    This is NOT road-routing ETA.
  */

  const etaMin =
    distance !== null
      ? Math.max(
          1,
          Math.round(
            distance /
              1000 /
              22 *
              60
          )
        )
      : null;


  const seats =
    Number(
      nearest.seats_available
    );


  const low =
    Number.isFinite(seats) &&
    seats <= 3;


  element.innerHTML = `
    <div class="shuttle-row">

      <div class="shuttle-icon">
        🚌
        <div class="live-dot"></div>
      </div>

      <div class="shuttle-info">

        <div class="name">
          ${escapeHTML(
            nearest.label
          )}
        </div>

        <div class="meta">
          ${
            nearest.routes
              ? escapeHTML(
                  nearest.routes.name
                )
              : "Route unassigned"
          }
        </div>

        <div class="seats-pill ${
          low ? "low" : ""
        }">

          ${
            Number.isFinite(seats)
              ? `${seats} seats left`
              : "Seat count unavailable"
          }

        </div>

      </div>

      <div class="shuttle-eta">

        <div class="big">
          ${
            etaMin !== null
              ? etaMin
              : "–"
          }
        </div>

        <div class="lbl">
          ${
            etaMin !== null
              ? "min away"
              : "LIVE"
          }
        </div>

      </div>

    </div>
  `;
}


/* ============================================================
   STOP SEARCH
   ============================================================ */

function openStopSearch() {

  const overlay =
    document.getElementById(
      "stop-search-overlay"
    );

  const input =
    document.getElementById(
      "stop-search-input"
    );


  overlay.classList.add(
    "show"
  );

  input.value = "";

  renderStopSearchResults("");

  setTimeout(
    () => input.focus(),
    50
  );
}


function closeStopSearch() {

  document
    .getElementById(
      "stop-search-overlay"
    )
    .classList.remove(
      "show"
    );
}


function renderStopSearchResults(
  query
) {

  const list =
    document.getElementById(
      "stop-search-list"
    );


  const q =
    query
      .trim()
      .toLowerCase();


  if (!stopsCache.length) {

    list.innerHTML = `
      <div class="search-empty">
        Stops haven't loaded yet.
      </div>
    `;

    return;
  }


  const matches =
    stopsCache.filter(
      stop =>
        !q ||
        String(stop.name)
          .toLowerCase()
          .includes(q)
    );


  if (!matches.length) {

    list.innerHTML = `
      <div class="search-empty">
        No stops match
        "${escapeHTML(query)}"
      </div>
    `;

    return;
  }


  list.innerHTML =
    matches
      .map(stop => {

        const route =
          routesCache.find(
            r =>
              r.id ===
              stop.route_id
          );


        const color =
          route
            ? (
                ROUTE_COLORS[
                  route.code
                ] ||
                "var(--blue-700)"
              )
            : "var(--slate)";


        return `
          <div
            class="route-card"
            onclick="goToStop('${escapeHTML(stop.id)}')"
          >

            <div
              class="route-badge"
              style="background:${color}"
            >
              ${
                route
                  ? escapeHTML(
                      route.code
                    )
                  : "•"
              }
            </div>

            <div style="flex:1">

              <div class="rname">
                ${escapeHTML(
                  stop.name
                )}
              </div>

              <div class="rfreq">
                ${
                  route
                    ? escapeHTML(
                        route.name
                      )
                    : "Route unavailable"
                }
              </div>

            </div>

            <div class="chev">
              ›
            </div>

          </div>
        `;
      })
      .join("");
}


function goToStop(stopId) {

  const stop =
    stopsCache.find(
      s =>
        String(s.id) ===
        String(stopId)
    );


  if (!stop) {

    showToast(
      "Stop not found."
    );

    return;
  }


  if (
    stop.lat == null ||
    stop.lng == null
  ) {

    showToast(
      "This stop has no map location."
    );

    return;
  }


  closeStopSearch();

  switchTab("home");


  map.setView(
    [
      Number(stop.lat),
      Number(stop.lng)
    ],
    18,
    {
      animate: true
    }
  );


  const stopMarker =
    stopMarkersData.find(
      item =>
        String(
          stopsCache.find(
            s =>
              s.id ===
              item.routeId
          )?.id
        ) ===
        String(stopId)
    );


  /*
    The marker lookup above may not be available
    depending on your route structure.

    Find the closest marker by coordinates instead.
  */

  const marker =
    stopMarkersData.find(
      item => {

        const position =
          item.marker.getLatLng();

        return (
          Math.abs(
            position.lat -
              Number(stop.lat)
          ) < 0.000001 &&
          Math.abs(
            position.lng -
              Number(stop.lng)
          ) < 0.000001
        );
      }
    );


  if (marker) {
    marker.marker.openPopup();
  }
}


/* ============================================================
   ROUTES
   ============================================================ */

function renderRoutesList() {

  const list =
    document.getElementById(
      "routes-list"
    );

  const count =
    document.getElementById(
      "routes-count"
    );


  if (!list) return;


  if (count) {

    count.textContent =
      `${routesCache.length} campus route${
        routesCache.length === 1
          ? ""
          : "s"
      }`;
  }


  if (!routesCache.length) {

    list.innerHTML = `
      <div class="search-empty">
        No routes available.
      </div>
    `;

    return;
  }


  list.innerHTML =
    routesCache
      .map(route => {

        const color =
          ROUTE_COLORS[
            route.code
          ] ||
          "var(--blue-700)";


        return `
          <div
            class="route-card"
            onclick="showRouteDetail('${escapeHTML(route.id)}')"
          >

            <div
              class="route-badge"
              style="background:${color}"
            >
              ${escapeHTML(
                route.code
              )}
            </div>

            <div style="flex:1">

              <div class="rname">
                ${escapeHTML(
                  route.name
                )}
              </div>

              <div class="rfreq">
                ${
                  route.frequency ||
                  "Campus shuttle"
                }
              </div>

            </div>

            <div class="chev">
              ›
            </div>

          </div>
        `;
      })
      .join("");
}


function showRouteDetail(routeId) {

  const route =
    routesCache.find(
      r =>
        String(r.id) ===
        String(routeId)
    );


  if (!route) {

    showToast(
      "Route not found."
    );

    return;
  }


  const detail =
    document.getElementById(
      "routes-detail-view"
    );

  const list =
    document.getElementById(
      "routes-list-view"
    );


  list.style.display =
    "none";

  detail.style.display =
    "flex";


  document.getElementById(
    "detail-name"
  ).textContent =
    `${route.code} · ${route.name}`;


  document.getElementById(
    "detail-freq"
  ).textContent =
    route.frequency ||
    "Campus shuttle";


  const stops =
    stopsCache
      .filter(
        stop =>
          stop.route_id ===
          route.id
      )
      .sort(
        (a, b) =>
          Number(a.sequence || 0) -
          Number(b.sequence || 0)
      );


  const container =
    document.getElementById(
      "detail-stops"
    );


  if (!stops.length) {

    container.innerHTML = `
      <div class="search-empty">
        No stops are configured
        for this route.
      </div>
    `;

    return;
  }


  container.innerHTML = `
    <div class="stop-list">

      ${stops
        .map(
          (stop, index) => `
            <div class="stop-item">

              <div class="stop-line">

                <div class="stop-dot"></div>

                ${
                  index <
                  stops.length - 1
                    ? `<div class="stop-connector"></div>`
                    : ""
                }

              </div>

              <div class="stop-body">

                <div class="sname">
                  ${escapeHTML(
                    stop.name
                  )}
                </div>

                <div class="stime">
                  ${formatTime(
                    stop.scheduled_time
                  )}
                </div>

              </div>

            </div>
          `
        )
        .join("")}

    </div>
  `;
}


function showRoutesList() {

  document.getElementById(
    "routes-list-view"
  ).style.display =
    "block";

  document.getElementById(
    "routes-detail-view"
  ).style.display =
    "none";
}


/* ============================================================
   SCHEDULE
   ============================================================ */

function renderSchedule() {

  const tabs =
    document.getElementById(
      "day-tabs"
    );

  const content =
    document.getElementById(
      "schedule-content"
    );


  if (!tabs || !content) return;


  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];


  tabs.innerHTML =
    days
      .map(
        (day, index) => `
          <button
            class="day-tab ${
              selectedDay === index
                ? "active"
                : ""
            }"
            onclick="selectDay(${index})"
          >
            ${day.slice(0, 3)}
          </button>
        `
      )
      .join("");


  if (!routesCache.length) {

    content.innerHTML = `
      <div class="loading-fill">
        <div class="spinner"></div>
        Loading schedule…
      </div>
    `;

    return;
  }


  content.innerHTML =
    routesCache
      .map(route => {

        const stops =
          stopsCache
            .filter(
              stop =>
                stop.route_id ===
                route.id
            )
            .sort(
              (a, b) =>
                Number(
                  a.sequence || 0
                ) -
                Number(
                  b.sequence || 0
                )
            );


        return `
          <div class="sched-route-group">

            <div class="sched-route-title">

              <span
                class="dot"
                style="
                  background:${
                    ROUTE_COLORS[
                      route.code
                    ] ||
                    "var(--blue-700)"
                  }
                "
              ></span>

              ${escapeHTML(
                route.code
              )}
              ·
              ${escapeHTML(
                route.name
              )}

            </div>


            <div class="sched-grid">

              ${
                stops.length
                  ? stops
                      .map(
                        stop => `
                          <div class="sched-grid-row">

                            <span class="stop-name">
                              ${escapeHTML(
                                stop.name
                              )}
                            </span>

                            <span class="stop-time">
                              ${formatTime(
                                stop.scheduled_time
                              )}
                            </span>

                          </div>
                        `
                      )
                      .join("")
                  : `
                    <div class="sched-grid-row">
                      <span class="stop-name">
                        No stops configured
                      </span>
                    </div>
                  `
              }

            </div>

          </div>
        `;
      })
      .join("");
}


function selectDay(day) {

  selectedDay =
    day;

  renderSchedule();
}


function formatTime(time) {

  if (!time) {
    return "–";
  }


  const parts =
    String(time)
      .split(":")
      .map(Number);


  const hour =
    parts[0];

  const minute =
    parts[1] || 0;


  const period =
    hour >= 12
      ? "PM"
      : "AM";


  const hour12 =
    hour % 12 === 0
      ? 12
      : hour % 12;


  return `
    ${hour12}:${String(
      minute
    ).padStart(2, "0")} ${period}
  `;
}


/* ============================================================
   TABS
   ============================================================ */

function switchTab(tab) {

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


/* ============================================================
   DRIVER MODE
   ============================================================ */

async function enterDriverMode() {

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


function exitDriverMode() {

  if (
    driverBroadcasting
  ) {

    stopDriverBroadcast();
  }

  showScreen(
    "app-screen"
  );
}


function toggleDriverBroadcast() {

  if (
    driverBroadcasting
  ) {

    stopDriverBroadcast();

  } else {

    startDriverBroadcast();
  }
}


/* ============================================================
   DRIVER GPS BROADCAST
   ============================================================ */

function startDriverBroadcast() {

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


/* ============================================================
   STOP DRIVER BROADCAST
   ============================================================ */

async function stopDriverBroadcast() {

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


/* ============================================================
   DRIVER SEATS
   ============================================================ */

async function adjustSeats(delta) {

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


/* ============================================================
   START APPLICATION
   ============================================================ */

checkExistingSession();
