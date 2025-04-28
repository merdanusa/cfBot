const axios = require("axios");
const ipRangeCheck = require("ip-range-check");

const resolveRealIP = async (domain) => {
  try {
    const res = await axios.get(
      `https://dns.google/resolve?name=${domain}&type=A`
    );
    const ip = res.data?.Answer?.find((a) => a.type === 1)?.data;
    return ip || domain;
  } catch {
    return domain;
  }
};

const isCloudflareIP = (ip) => {
  const cloudflareIPRanges = [
    "104.16.0.0/12",
    "104.17.0.0/16",
    "172.64.0.0/13",
    "131.0.72.0/22",
    "104.18.0.0/15",
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ];

  return cloudflareIPRanges.some((range) => ipRangeCheck(ip, range));
};

module.exports = { resolveRealIP, isCloudflareIP };
