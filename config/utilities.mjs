import CryptoJS from "crypto-js";

export function encrypt(req) {
  const message = req.params.text;
  const key = process.env.CIPHER_KEY;
  const options = {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  };
  const encrypted = CryptoJS.AES.encrypt(message, key, options);
  //const encoded = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  //const safeEncoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const crypted = encrypted.toString();
  console.log("crypted: ", encrypted.toString());
  return crypted;
}

export function decrypt(req) {
  const message = req.params.text;
  console.log("de message: ", message);
  // Decode the encoded value using Base64 URL decoding
  //const encoded = 'cVZjdFQ2bm5NSkczd0ZpNnVzdHhybG1BdXJjZlFWWUJrK1ZiYzZ0UD0';
  //const safeEncoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  //const decoded = Buffer.from(safeEncoded, 'base64').toString('utf-8');
  //console.log('decoded: ', decoded);
  const key = process.env.CIPHER_KEY;
  const options = { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 };
  //const ciphertext = CryptoJS.enc.Base64.parse(safeEncoded);
  //console.log('ciphertext: ', ciphertext);
  const decrypted = CryptoJS.AES.decrypt(message, key, options);
  const crypted = decrypted.toString(CryptoJS.enc.Utf8);
  console.log("decrypted: ", crypted);
  return crypted;
}

/*function encrypt(text) {
    var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }
  function decrypt(text) {
    var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq');
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }*/

export const compareArrays = (arr, mega) => {
  for (let i = 0; i < mega.length; i++) {
    if (arr && !arr.includes(mega[i])) {
      return false;
    }
  }
  return true;
};

import querystring from "querystring";
import https from "https";

export function makeApiRequest(data, callback) {
  var postData = querystring.stringify(data);

  var options = {
    host: process.env.KOUNT_TEST_RIS_URL,
    path: "/",
    port: "443",
    method: "POST",
    headers: {
      "X-Kount-Api-Key": process.env.KOUNT_TEST_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  var req = https.request(options, function (res) {
    var str = "";
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      str += chunk;
    });
    res.on("end", function () {
      callback(null, str);
    });
  });

  req.on("error", function (err) {
    callback(err, null);
  });

  req.write(postData);
  req.end();
}
console.log("process.env.KOUNT_TEST_KEY---", process.env.KOUNT_TEST_KEY);
// Example usage:

export const getIpAdress = (stringWithPrefix) => {
  const stringWithoutPrefix = stringWithPrefix?.replace("::ffff:", "");
  return stringWithoutPrefix;
};
