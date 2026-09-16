export let currentUser = null;
export let currentProfile = null;
export let map = null;
export let userMarker = null;
export const shuttleMarkers = {};
export let stopMarkersData = [];
export let routesCache = [];
export let stopsCache = [];
export let shuttlesCache = [];
export let realtimeChannel = null;
export let userLatLng = null;
export let watchId = null;
export let driverBroadcasting = false;
export let driverShuttle = null;
export let driverSeats = 0;
export let driverWatchId = null;
export let activeRouteFilter = null;
export let selectedRole = "passenger";
export let selectedDay = new Date().getDay();

export const setState = {
  currentUser: v => currentUser = v,
  currentProfile: v => currentProfile = v,
  map: v => map = v,
  userMarker: v => userMarker = v,
  stopMarkersData: v => stopMarkersData = v,
  routesCache: v => routesCache = v,
  stopsCache: v => stopsCache = v,
  shuttlesCache: v => shuttlesCache = v,
  realtimeChannel: v => realtimeChannel = v,
  userLatLng: v => userLatLng = v,
  watchId: v => watchId = v,
  driverBroadcasting: v => driverBroadcasting = v,
  driverShuttle: v => driverShuttle = v,
  driverSeats: v => driverSeats = v,
  driverWatchId: v => driverWatchId = v,
  activeRouteFilter: v => activeRouteFilter = v,
  selectedRole: v => selectedRole = v,
  selectedDay: v => selectedDay = v
};
