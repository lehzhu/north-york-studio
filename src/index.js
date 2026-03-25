const TERRY_HOSTS = new Set([
  "terry.northyorkstudio.com"
]);

const HOME_HOSTS = new Set([
  "northyorkstudio.com",
  "www.northyorkstudio.com"
]);

function assetRequest(url, path) {
  const assetUrl = new URL(url);
  assetUrl.pathname = path;
  assetUrl.search = "";
  return new Request(assetUrl.toString(), {
    method: "GET",
    headers: {
      accept: "text/html"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (pathname === "/" || pathname === "/index.html") {
      if (HOME_HOSTS.has(hostname)) {
        return env.ASSETS.fetch(assetRequest(url, "/home.html"));
      }

      if (TERRY_HOSTS.has(hostname) || hostname.endsWith(".workers.dev")) {
        return env.ASSETS.fetch(assetRequest(url, "/index.html"));
      }
    }

    return env.ASSETS.fetch(request);
  }
};
