import crypto from "crypto";
import CryptoJS from "crypto-js";

export const decryptPass = (encryptedPassword) => {
  try {
    const algorithm = "aes-192-cbc";
    const password = "gvytbffvsca#a%#$%#$j^$m#NHM4A645335";
    const key = crypto.scryptSync(password, "salt", 24);
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const encrypted = encryptedPassword;
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.log("error in decryption", e);
    return null;
  }
};

export const decryptData = (encryptedData) => {
  const PUBLICK_KEY = "AC2d27e9ad2978d70ffb5637ce05542078";

  const bytes = CryptoJS.AES.decrypt(encryptedData, PUBLICK_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
