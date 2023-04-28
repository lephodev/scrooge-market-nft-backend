import crypto from "crypto";

export const verifyResult = (serverseed, clientseed, nounce, products) => {
  const fullSeed = crypto
    .createHash("sha256")
    .update(`${serverseed}:${clientseed}:${nounce}`)
    .digest("hex");
  const seed = fullSeed.substr(0, 8);
  return parseInt(seed, 16) % products;
};

export const generateServerSeed = () => crypto.randomBytes(64).toString("hex");

export const checkUserCanSpin = (lastSpinTime) => {
  if (lastSpinTime) {
    let date1 = Date.now();
    const date2 = new Date(lastSpinTime);
    const diffTime = (date2 - date1) / 1000;
    if (!(diffTime <= 0)) {
      return false;
    }
  }
  return true;
};
