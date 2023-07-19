import sha512 from "js-sha512";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

console.log("key",process.env.AUTHORIZE_SIGN_KEY)
let signature = process.env.AUTHORIZE_SIGN_KEY || "98A857F61A99FEF3C62796A06616204CA1EB6C4FDDB86A5F97708B5BB754D625D4B36C24F6D404EC3C3EACA160B454EF406CD8CAA99D44628A3C7B89A51A97C7"



const isHashEqual = (hash, body) => {
    console.log("bb", body)
    const h = crypto.createHmac('sha512', signature)
                   .update(body)
                   .digest('hex')
                   .toUpperCase();
    const sig = sha512.hmac(Buffer.from(signature, 'hex'), body).toUpperCase();
    console.log("ddd", "\n",h, "\n",sig,"\n", hash)
    return hash === sig || hash === h
}
const body = "^9XRP23d3n6^44193651172^5^";
const b = {
  notificationId: 'beb734c5-3712-47bc-8c3e-0e5dc8176e13',
  eventType: 'net.authorize.payment.authcapture.created',
  eventDate: '2023-07-13T04:43:21.3063901Z',
  webhookId: '27f2e167-3810-429a-a886-89b04218d921',
  payload: {
    responseCode: 1,
    authCode: '215042',
    avsResponse: 'P',
    authAmount: 5,
    entityName: 'transaction',
    id: '44193651172'
  }
}
    

const isMatch = isHashEqual('2F339B3BF33D48447737EA3387B70FE699C4AF737BD1A3E9378C63FFD5AA30E41D25EE42E6D540541C82D52CFA4A7AD1DACDE72C0E2C0BA419AE0839CC85048C', JSON.stringify(b));
console.log(isMatch)