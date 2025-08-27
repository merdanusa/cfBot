const axios = require("axios");

const spyDomain = async (domain) => {
  try {
    const response = await axios.get(
      `https://searchdns.netcraft.com/?restriction=site+contains&host=${domain}`
    );

    return `
🕵️ <b>Spy Results for ${domain}:</b>
╔═════════════════
╟─🌐 <b>Domain:</b> ${domain}
╟─🔍 <b>Registered:</b> Information from Netcraft
╟─🛡️ <b>Security:</b> Analysis results
╟─📊 <b>Rank:</b> Network information
╚═════════════════
        `.trim();
  } catch (error) {
    throw new Error("Failed to fetch spy information");
  }
};

module.exports = { spyDomain };
