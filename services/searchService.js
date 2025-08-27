const dns = require("dns").promises;
const axios = require("axios");
const { resolveRealIP, isCloudflareIP } = require("../utils/cloudflare");
const { checkOpenPorts } = require("./portService");
const cache = require("./cacheService");
const { isFastlyIP } = require("../utils/fastly");

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
        ? `🚪 <b>Open Ports:</b> ${openPorts.join(", ")}`
        : "🚪 <b>No open ports found.</b>";

    const isCF = isCloudflareIP(realIp);
    const isFastly = isFastlyIP(realIp);
    const proxyStatus = isCF || isFastly ? "Yes" : "No";
    const service = isCF ? "Cloudflare" : isFastly ? "Fastly" : "None";

    const info = `
🌐 <b>Query:</b> ${query}
📍 <b>Resolved IP:</b> ${realIp}
🌍 <b>Country:</b> ${data.country}
🏙️ <b>City:</b> ${data.city}
🔐 <b>Proxy:</b> ${proxyStatus}
🛡️ <b>Service:</b> ${service}
${portsInfo}
        `.trim();

    cache.set(query, info);
    return info;
  } catch (err) {
    return `❌ Error: ${err.message}`;
  }
};

module.exports = { searchDomainOrIP };
