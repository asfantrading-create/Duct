// Tiny observable app state.
const state = { info: null, settings: null, license: null, profiles: [], profile: null, results: null, updates: { status: 'idle' }, classroom: null, route: null, routeParams: {} };
const subs = new Set();
export function getState() { return state; }
export function setState(patch) { Object.assign(state, patch); subs.forEach((cb) => cb(state, patch)); return state; }
export function subscribe(cb) { subs.add(cb); return () => subs.delete(cb); }
export function isSupervisorLicense() { return !!(state.license && state.license.ok && state.license.payload && state.license.payload.role === 'supervisor'); }
export function isSupervisorSession() { return !!(state.profile && state.profile.role === 'supervisor'); }
export function moduleLicensed(id) {
  const p = state.license && state.license.ok ? state.license.payload : null;
  if (!p) return false;
  return !Array.isArray(p.modules) || p.modules.length === 0 || p.modules.includes(id);
}
