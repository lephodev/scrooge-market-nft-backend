import CryptoJS from "crypto-js";

const secretKey = process.env.TOKEN_ENCRYPTION_STRING;

const decryptPayload = (req, res, next)=>{
    console.log("decryptted data",req.originalUrl, req.body);
    if(Object.keys(req?.body).length ){
        const bytes = CryptoJS.AES.decrypt(req?.body?.payload, secretKey);
        const decryptedPayload = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        req.body = decryptedPayload;
        console.log("Decrypted Payload:", decryptedPayload, bytes.toString(CryptoJS.enc.Utf8));
    }
    next();
}

export default decryptPayload;