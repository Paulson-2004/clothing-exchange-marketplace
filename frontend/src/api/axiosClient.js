import axios from 'axios';

// Central axios instance used by every API call in the app.
// `withCredentials: true` is required so the httpOnly JWT cookie
// (set by the backend during login) is sent with each request across domains.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Cold-start (Render free-tier wake-up) indicator state.
// UX-ONLY: this never blocks, retries, or modifies requests. It only tracks
// how long requests stay pending so the UI can reassure the user when the
// backend takes unusually long (e.g. waking from Render inactivity).
// ---------------------------------------------------------------------------
// Show the notice only when a request is still pending after this long.
// 10s sits inside the requested ~10-15s window: long enough that normal and
// fast responses never trigger it, short enough to reassure before a
// Render cold start (~30-60s) finishes.
export const COLD_START_THRESHOLD_MS = 10000;

let nextColdStartId = 0;
// requestId -> timeout id for requests still in flight.
const pendingColdStartTimers = new Map();
// requestIds whose pending time already exceeded the threshold.
const slowColdStartRequests = new Set();
const coldStartListeners = new Set();

const emitColdStartChange = () => {
  const visible = slowColdStartRequests.size > 0;
  coldStartListeners.forEach((listener) => {
    try {
      listener(visible);
    } catch {
      // Never let a UI listener break request handling.
    }
  });
};

// Subscribe to cold-start visibility. The callback receives a boolean and is
// invoked immediately with the current value. Returns an unsubscribe fn.
export const subscribeColdStartNotice = (listener) => {
  coldStartListeners.add(listener);
  listener(slowColdStartRequests.size > 0);
  return () => {
    coldStartListeners.delete(listener);
  };
};

export const isColdStartNoticeVisible = () => slowColdStartRequests.size > 0;

const trackColdStartRequest = (config) => {
  // Allowlist for opting out (e.g. a future intentionally long-running
  // request with its own dedicated progress UI). Nothing opts out today;
  // the option exists so we never double up on messaging.
  if (config?.skipColdStartNotice) return config;
  const requestId = ++nextColdStartId;
  // eslint-disable-next-line no-param-reassign
  config.__coldStartId = requestId;
  const timeoutId = setTimeout(() => {
    // Only flag requests that are genuinely still waiting.
    if (pendingColdStartTimers.has(requestId)) {
      slowColdStartRequests.add(requestId);
      emitColdStartChange();
    }
  }, COLD_START_THRESHOLD_MS);
  pendingColdStartTimers.set(requestId, timeoutId);
  return config;
};

const untrackColdStartRequest = (configOrError) => {
  const requestId = configOrError?.config?.__coldStartId ?? configOrError?.__coldStartId;
  if (requestId == null) return;
  const timeoutId = pendingColdStartTimers.get(requestId);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    pendingColdStartTimers.delete(requestId);
  }
  // Only re-emit when a flagged (slow) request settles, so one completed
  // fast request can never hide the notice while another slow one is pending.
  if (slowColdStartRequests.delete(requestId)) {
    emitColdStartChange();
  }
};

axiosClient.interceptors.request.use(
  (config) => trackColdStartRequest(config),
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    untrackColdStartRequest(response);
    return response;
  },
  (error) => {
    // Covers failed requests AND cancellations (AbortController / axios
    // CanceledError): the notice must disappear in every settle case.
    untrackColdStartRequest(error);
    return Promise.reject(error);
  }
);

export default axiosClient;
