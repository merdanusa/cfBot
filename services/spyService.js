const axios = require("axios");
const dns = require("dns").promises;
const whois = require("whois-json");

const spyDomain = async (domain) => {
  try {
    // Get DNS information
    const dnsRecords = await dns.resolve4(domain).catch(() => []);
    const mxRecords = await dns.resolveMx(domain).catch(() => []);

    // Get WHOIS information
    const whoisData = await whois(domain);

    // Get SSL certificate info (simplified)
    const sslInfo = await getSSLInfo(domain);

    // Get website headers
    const headers = await getHeaders(domain);

    // Get social media presence (simplified)
    const socialMedia = await checkSocialMedia(domain);

    return `
🕵️ <b>SPY RESULTS FOR ${domain.toUpperCase()}</b>
╔══════════════════════════════
╟─🌐 <b>Domain:</b> ${domain}
╟─📍 <b>IP Address:</b> ${dnsRecords[0] || "N/A"}
╟─🏢 <b>Registrar:</b> ${whoisData.registrar || "Unknown"}
╟─📅 <b>Created:</b> ${whoisData.creationDate || "Unknown"}
╟─🛡️ <b>SSL:</b> ${sslInfo ? "Valid ✅" : "Invalid ❌"}
╟─📧 <b>Email MX:</b> ${mxRecords.length > 0 ? "Yes ✅" : "No ❌"}
╟─🌍 <b>Server:</b> ${headers.server || "Unknown"}
╟─📊 <b>Social Media:</b> ${socialMedia.length} platforms found
╟─🔒 <b>Security Headers:</b> ${checkSecurityHeaders(headers)}
╟─⚡ <b>CDN:</b> ${detectCDN(headers)}
╚══════════════════════════════

💡 <i>Pro tip: Use our VIP service for deeper analysis!</i>
        `.trim();
  } catch (error) {
    console.error("Spy error:", error);
    return `
🕵️ <b>SPY RESULTS FOR ${domain.toUpperCase()}</b>
╔══════════════════════════════
╟─❌ <b>Error:</b> Could not gather complete intelligence
╟─💡 <b>Tip:</b> Domain may be protected or unreachable
╚══════════════════════════════
        `.trim();
  }
};

const getSSLInfo = async (domain) => {
  try {
    await axios.get(`https://${domain}`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

const getHeaders = async (domain) => {
  try {
    const response = await axios.get(`https://${domain}`, {
      timeout: 3000,
      validateStatus: null,
    });
    return response.headers;
  } catch {
    return {};
  }
};

const checkSocialMedia = async (domain) => {
  // Simplified social media check
  const platforms = ["facebook", "twitter", "instagram", "linkedin"];
  const found = [];

  for (const platform of platforms) {
    try {
      await axios.get(`https://${platform}.com/${domain}`, { timeout: 2000 });
      found.push(platform);
    } catch (error) {
      if (error.response?.status !== 404) {
        found.push(platform);
      }
    }
  }

  return found;
};

const checkSecurityHeaders = (headers) => {
  const securityHeaders = [
    "x-frame-options",
    "x-content-type-options",
    "x-xss-protection",
    "strict-transport-security",
  ];
  return securityHeaders.filter((header) => headers[header]).length;
};

const detectCDN = (headers) => {
  const cdnHeaders = headers["server"] || headers["via"] || "";
  if (cdnHeaders.includes("cloudflare")) return "Cloudflare";
  if (cdnHeaders.includes("fastly")) return "Fastly";
  if (cdnHeaders.includes("akamai")) return "Akamai";
  return "None detected";
};

module.exports = { spyDomain };
