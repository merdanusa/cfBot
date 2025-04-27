const dns = require("dns").promises;
const axios = require("axios");
const { resolveRealIP } = require("../utils/cloudflare");
const { checkOpenPorts } = require("./portService");
const cache = require("./cacheService");

const searchDomainOrIP = async (query) => {
  try {
    const cached = cache.get(query);
    if (cached) return cached;

    const realIp = await resolveRealIP(query);
    const res = await axios.get(`http://ip-api.com/json/${realIp}`);
    const data = res.data;

    if (data.status !== "success") throw new Error("Invalid IP/Domain");

    const openPorts = await checkOpenPorts(realIp);
    const portsInfo =
      openPorts.length > 0
        ? `🚪 Open Ports: <b>${openPorts.join(", ")}</b>`
        : "🚪 No open ports found.";

    const info = `
🌐 Query: <b>${query}</b>
📍 Resolved IP: <b>${realIp}</b>
🌍 Country: <b>${data.country}</b>
🏙️ City: <b>${data.city}</b>
🔐 Proxy: <b>${data.proxy ? "Yes" : "No"}</b>
🛡️ Cloudflare: <b>${data.org.includes("Cloudflare") ? "Yes" : "No"}</b>
${portsInfo}
    `;

    cache.set(query, info);
    return info;
  } catch (err) {
    return `❌ Error: ${err.message}`;
  }
};

module.exports = { searchDomainOrIP };
