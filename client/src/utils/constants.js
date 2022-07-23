const ENVIRONMENT = "PROD"; // PROD / DEV
export const INTERAKT_CONTRACT_ADDRESS =
  "0xD2CBcC8cD99e6eA70001b6CFb7b983dB69286CFA";
// "0x5A1f011E8F010f8B6Abf81e75Db34866b685ca54";

export const DAI_CONTRACT_ADDRESS =
  // "0xD2CBcC8cD99e6eA70001b6CFb7b983dB69286CFA";
  "0x332C7aC34580dfEF553B7726549cEc7015C4B39b";

export const MINT_TOKEN = 1000000000000000000000n;

export const WEB_STORAGE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDA5NzdhMEY3QTgyOTZmOGFDMjg2QjJiODIxMDZkNjhlMThhOTlkMTMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTgxNTA3NTgzMzIsIm5hbWUiOiJJbnRlcmFja3kifQ.eG_arM-_YvswSqn8UYg1qs3iBSIRoGerf3G5BRi67sg";

export const ConvertDAIPreciseToReadable = (BigNumber) =>
  +(BigNumber / 1000000000000000000).toString();

export const ConvertDAIReadableToPrecise = (DAI) =>
  // eslint-disable-next-line no-undef
  BigInt(DAI) * BigInt(1000000000000000000);

export const ConvertPerHourCostToContractPerSecondCost = (DAI) =>
  // eslint-disable-next-line no-undef
  BigInt(DAI) * BigInt(100000000000000000000);

export const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);

    return null;
  }
  return item.value;
};

export const INTERAKT_API_URL =
  ENVIRONMENT === "PROD"
    ? "https://app.interakt.club"
    : "http://localhost:9000";
export const INTERAKT_APP_URL =
  ENVIRONMENT === "PROD"
    ? "https://app.interakt.club"
    : "http://localhost:3000";

export const SESSION_EXPIRY_TIME = 1200000; // 10 min in milliseconds

export const SESSION_MESSAGES = {
  END_SESSION: "END_SESSION",
  REQUEST_FOR_ACKNOWLEDGE_CONNECTION: "REQUEST_FOR_ACKNOWLEDGE_CONNECTION",
  ACKNOWLEDGE_CONNECTION: "ACKNOWLEDGE_CONNECTION",
  SUCCESSFULLY_ENDED_CONTRACT: "SUCCESSFULLY_ENDED_CONTRACT",
};

export const costPerMinutes = (perHourCost, minutes) => {
  const hours = +(+minutes / 60).toFixed(2);
  return +hours * +perHourCost;
};

export const stopBothVideoAndAudio = (stream) => {
  if (stream.getTracks)
    stream.getTracks().forEach(function (track) {
      if (track.readyState == "live") {
        track.stop();
      }
    });
  console.log("stream : ", stream);
};

export const PEER_HOST =
  ENVIRONMENT === "PROD" ? "app.interakt.club" : "localhost";
export const PEER_PORT = ENVIRONMENT === "PROD" ? 443 : 9000;
export const PEER_PATH = "/peer";
export const PEER_SECURE = ENVIRONMENT === "PROD" ? true : false;
export const PEER_DEBUG = 2;

export const CERAMIC_SESSION_SCHEMA_ID =
  "k3y52l7qbv1fry8m0h98yh6lxc5yxkv5wtfqvgmsbmpbzq3w3bxfjy3nc596q9atc";

export const blobToBase64 = (blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

export const unit8ArrayToString = (unit8Array) => {
  let arr = Array.from // if available
    ? Array.from(unit8Array) // use Array#from
    : [].map.call(unit8Array, (v) => v); // otherwise map()
  return JSON.stringify(arr);
};

export const StringToUnit8Array = (_string) => {
  return new Uint8Array(JSON.parse(_string));
};
