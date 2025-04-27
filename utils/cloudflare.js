const axios = require("axios");

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

module.exports = { resolveRealIP };
