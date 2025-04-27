const net = require("net");

const checkPort = (ip, port) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(port);
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject();
    });
    socket.on("error", () => {
      reject();
    });
    socket.connect(port, ip);
  });
};

const checkOpenPorts = async (ip) => {
  const ports = [80, 443];
  const openPorts = [];

  for (const port of ports) {
    try {
      await checkPort(ip, port);
      openPorts.push(port);
    } catch {}
  }
  return openPorts;
};

module.exports = { checkOpenPorts };
