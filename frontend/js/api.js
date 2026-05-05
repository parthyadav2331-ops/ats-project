// Shared API helper for CareersFit frontend.
// Backend is served from same origin when started via `npm run dev`,
// but falls back to localhost:5000 for direct file:// usage.
window.API_BASE = location.protocol.startsWith("http")
  ? location.origin
  : "http://localhost:5001";

window.getToken = () => localStorage.getItem("token");
window.getRole = () => localStorage.getItem("role");

window.requireAuth = (allowedRoles) => {
  const token = getToken();
  if (!token) {
    window.location.href = "loginpage.html";
    return false;
  }
  if (allowedRoles && allowedRoles.length) {
    const role = getRole();
    if (!allowedRoles.includes(role)) {
      window.location.href =
        role === "recruiter" ? "dashboard.html" : "how-it-works.html";
      return false;
    }
  }
  return true;
};

window.logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "loginpage.html";
};

window.api = async (path, opts = {}) => {
  const token = getToken();
  const headers = opts.headers || {};
  if (!opts.body || !(opts.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { ...opts, headers });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

window.highlightNav = () => {
  const links = document.querySelectorAll(".nav-link");
  const page = window.location.pathname.split("/").pop() || "";
  links.forEach((a) => {
    if (a.getAttribute("href") === page) {
      a.style.background = a.dataset.activeBg || "#3b82f6";
      a.style.color = "white";
    }
  });
};
