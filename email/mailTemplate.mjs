const numFormatter = (num) => {
  let isNegativeNum = false;
  if (num < 0) {
    isNegativeNum = true;
    num = Math.abs(num);
  }
  let numberValue = num;
  if (numberValue < 1 && numberValue > 0) {
    numberValue = (numberValue / 1)?.toFixed(2);
  } else if (numberValue > 1 && numberValue < 999) {
    numberValue = (numberValue / 1)?.toFixed(0); // convert to K for number from > 1000 < 1 million
  } else if (numberValue > 999 && numberValue < 1000000) {
    numberValue = (numberValue / 1000).toFixed(2) + "K"; // convert to K for number from > 1000 < 1 million
  } else if (numberValue >= 1000000 && numberValue < 1000000000) {
    numberValue = (numberValue / 1000000).toFixed(2) + "M"; // convert to M for number from > 1 million
  } else if (numberValue >= 100000000 && numberValue < 1000000000000) {
    numberValue = (numberValue / 100000000).toFixed(2) + "B";
  } else if (numberValue >= 1000000000000)
    numberValue = (numberValue / 1000000000000).toFixed(2) + "T";
  // else return numberValue; // if value < 1000, nothing to do
  if (isNegativeNum) {
    return `-${numberValue}`;
  } else {
    return numberValue;
  }
};

export const SUBMIT_REDEEM_REQUEST = (username, prize) => {
  return `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;800&display=swap"
      rel="stylesheet"
    />
    <style>
      * {
        margin: 0;
        padding: 0;

        color: #ddd;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
    <title>Scrooge Welcome</title>
  </head>

  <body
    style="
      background: #000;
      margin: 0px auto;
      padding: 0;
      max-width: 650px;
      width: 100%;
      text-align: center;
      font-family: 'Poppins', sans-serif;
    "
  >
    <div style="padding: 20px 40px 40px; background: #151515">
      <header
        style="
          text-align: center;
          padding: 6px 2px;
          max-width: 700px;
          width: 100%;
        "
      >
        <div>
          <img
            src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/top-hot.png"
            alt=""
            style="width: 55px"
          />
        </div>
      </header>

      <main
        style="
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
          align-items: center;
          max-width: 700px;
          width: 100%;
        "
      >
        <div style="text-align: center; gap: 10px">
          <h1
            style="
              color: rgb(255, 255, 255);
              font-size: 30px;
              font-weight: 500;
              font-family: 'Poppins', sans-serif;
            "
          >
            Hello ${username},
          </h1>
          <h4
            style="
              color: rgb(255, 255, 255);
              font-size: 22px;
              font-weight: 600;
              font-family: 'Poppins', sans-serif;
            "
          >
            Congrats on your win at Scrooge LLC,
          </h4>
        </div>
        <div class="congratsImg" style="margin: 20px auto">
          <img
            src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/logo.png"
            alt=""
            style="width: 250px; opacity: 0.7"
          />
        </div>
        <div style="text-align: center">
          <p
            style="
              font-size: 20px;
              color: rgb(207, 207, 207);
              font-family: 'Poppins', sans-serif;
            "
          >
            We have received your redemption request of <br />
            Token: ${prize} <br />
            USD: $ ${prize / 100} <br />

            This review process is typically completed inside 24H, with the
            exception of weekends or holidays. If your method of choice was
            Crypto and you need some guidance, please download the instructional
            PDF here. You may also find assistance through these short videos of
            the process here! If you have any further questions regarding the
            process, feel free to reach out to us at info@scrooge.casino
            <br />
            If this is your first time redeeming and you need some guidance,
            please
            <a
              href="https://market.scrooge.casino/static/media/SCROOGE%20Redemption%20Manual.60fd5a4a7bf48ee3a8e1.pdf"
              target="_blank"
              >download</a
            >
            the instructional PDF here.
            <br />
            If you have any further questions regarding the process, feel free
            to reach out to us on Facebook Messenger.

            <a
              href="https://drive.google.com/drive/folders/1-6E0Fhnf-JU28oZJHlrpwTYJHlCTIiiq"
              target="_blank"
              >Video of the process here</a
            >

            <!-- We have received your redemption request for ${prize} Tokens, we will process this as soon as we can and send you an email upon completion.                 -->
          </p>
        </div>
        <div
          style="
            margin-top: 18px !important;
            padding-top: 18px;
            border-top: 1px solid hsl(0deg 0% 20%) !important;
            display: flex;
            justify-content: center !important;
            align-items: center !important;
            flex-direction: column;
            text-align: center !important;
            gap: 10px;
            width: 100%;
          "
        >
          <h4
            style="
              color: rgb(207, 207, 207);
              font-weight: 600;
              font-family: 'Poppins', sans-serif;
              margin: 20px auto;
            "
          >
            Join Our Community !
          </h4>
          <div
            style="
              width: 100%;
              text-align: center !important;
              display: flex;
              justify-content: center;
              max-width: 200px;
              margin: 0px auto;
            "
          >
            <a
              href="https://www.facebook.com/scroogegold/"
              target="_blank"
              rel="noopener noreferrer"
              style="
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: inline-block;
                margin: 5px;
              "
              ><img
                src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-facebook-144.png"
                alt="Logo"
                title="Logo"
                style="display: block"
                width="30"
                height="30"
              />
            </a>
            <a
              href="https://twitter.com/Scrooge_Casino"
              target="_blank"
              rel="noopener noreferrer"
              style="
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: grid;
                place-content: center;
                margin: 5px;
              "
              ><img
                src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-twitter-144.png"
                alt="Logo"
                title="Logo"
                style="display: block"
                width="30"
                height="30"
              />
            </a>
            <!-- <a href="https://t.me/scroogecoingold" target="_blank" rel="noopener noreferrer" style="
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: grid;
                place-content: center;
                margin: 5px;
              "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-telegram-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
            </a> -->
            <!-- <a href="https://discord.com/invite/scroogecoin" target="_blank" rel="noopener noreferrer" style="
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: grid;
                place-content: center;
                margin: 5px;
              "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-discord-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
            </a>
            <a href="https://www.reddit.com/r/scroogecoin/" target="_blank" rel="noopener noreferrer" style="
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: grid;
                place-content: center;
                margin: 5px;
              "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-reddit-120.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" /></a> -->
          </div>
          <h6
            style="
              font-size: 16px;
              color: rgb(207, 207, 207);
              margin-top: 20px;
              font-family: 'Poppins', sans-serif;
            "
          >
            Need Help ?
          </h6>
          <p
            style="
              color: rgb(207, 207, 207);
              font-size: 14px;
              font-family: 'Poppins', sans-serif;
            "
          >
            Please send any feedback or bug reports to
            <a
              href="mailto:info@scrooge.casino"
              style="color: #f9ff00; font-family: 'Poppins', sans-serif"
              >info@scrooge.casino</a
            >
          </p>
          <p
            style="
              color: rgb(207, 207, 207);
              font-size: 14px;
              font-family: 'Poppins', sans-serif;
            "
          >
            © 2024 - SCROOGE, LLC- All Rights Reserved
          </p>
        </div>
      </main>
    </div>
  </body>
</html>`;
};

export const APPROVE_REDEEM_REQUEST = (prize_price, username, hash, from) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
  
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;800&display=swap" rel="stylesheet" />
        <style>
          * {
            margin: 0;
            padding: 0;
    
            color: #ddd;
          }
    
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
        <title>Scrooge Welcome</title>
      </head>
    
      <body style="
          background: #000;
          margin: 0px auto;
          padding: 0;
          max-width:650px;
          width:100%;
          text-align:center;
          font-family: 'Poppins', sans-serif;
        ">
        <div style="padding: 20px 40px 40px; background: #151515">
          <header style="
              text-align: center;
              padding: 6px 2px;
              max-width: 700px;
              width: 100%;
            ">
            <div>
              <img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/top-hot.png" alt="" style="width: 55px" />
            </div>
          </header>
    
          <main style="
              display: flex;
              flex-direction: column;
              gap: 10px;
              justify-content: center;
              align-items: center;
              max-width: 700px;
              width: 100%;
            ">
            <div style="text-align: center; gap: 10px">
              <h1 style="
                  color: rgb(255, 255, 255);
                  font-size: 30px;
                  font-weight: 500;
                  font-family: 'Poppins', sans-serif;
                ">
                Hello ${username},
              </h1>
              <h4 style="
                  color: rgb(255, 255, 255);
                  font-size: 22px;
                  font-weight: 600;
                  font-family: 'Poppins', sans-serif;
                ">
                Congrats from Scrooge LLC,

              </h4>
            </div>
            <div class="congratsImg" style="margin: 20px auto">
              <img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/logo.png" alt="" style="width: 250px; opacity: 0.7" />
            </div>
            <div style="text-align: center">
              <p style="
              font-size: 20px;
                  color: rgb(207, 207, 207);
                  font-family: 'Poppins', sans-serif;
                ">
                We are pleased to inform you that your redemption request of
                <br> Token: ${prize_price}
                <br> USD: $ ${prize_price / 100}
                <br> Has been processed.  The Scrooge cryptocurrency is now in your wallet. The following is the successful transaction hash from the transfer: ${hash}
                </p>
                <p style="
                font-size: 20px;
                    color: rgb(207, 207, 207);
                    font-family: 'Poppins', sans-serif;
                  ">
                  You can search this on <a href="www.bscscan.com" target="_blank">www.bscscan.com</a>  to validate the transaction.
                  </p>

                  <p style="
                font-size: 20px;
                    color: rgb(207, 207, 207);
                    font-family: 'Poppins', sans-serif;
                  ">
                  If this is your first time redeeming and you need some guidance, please <a href="https://market.scrooge.casino/static/media/Manual.703b0c26cd8fd014a77d.pdf" target="_blank">download</a> the instructional PDF here
                  </p>
                  <!-- <p style="
                font-size: 20px;
                    color: rgb(207, 207, 207);
                    font-family: 'Poppins', sans-serif;
                  ">
                  1.Switch to BNB chain
                  </p>
                  <p style="
                  font-size: 20px;
                      color: rgb(207, 207, 207);
                      font-family: 'Poppins', sans-serif;
                    ">
                    2.Click Import Tokens

                  </p>
                  <p style="
                      font-size: 20px;
                          color: rgb(207, 207, 207);
                          font-family: 'Poppins', sans-serif;
                      ">
                      3.Click Custom Token
                  </p>
                  <p style="
                      font-size: 20px;
                          color: rgb(207, 207, 207);
                          font-family: 'Poppins', sans-serif;
                      ">
                      4.Enter the following contract address
                  </p>
                  <p style="
                      font-size: 20px;
                          color: rgb(207, 207, 207);
                          font-family: 'Poppins', sans-serif;
                      ">
                      ${from}
                  </p> -->
                  <p style="
                  font-size: 20px;
                      color: rgb(207, 207, 207);
                      font-family: 'Poppins', sans-serif;
                  ">
                  If you have any further questions regarding the process, feel free to reach out to us on Facebook Messenger.
                  </p>
            </div>
            <div style="
                margin-top: 18px !important;
                padding-top: 18px;
                border-top: 1px solid hsl(0deg 0% 20%) !important;
                display: flex;
                justify-content: center !important;
                align-items: center !important;
                flex-direction: column;
                text-align: center !important;
                gap: 10px;
                width: 100%;
              ">
              <h4 style="
                  color: rgb(207, 207, 207);
                  font-weight: 600;
                  font-family: 'Poppins', sans-serif;
                  margin: 20px auto;
                ">
                Join Our Community !
              </h4>
              <div style="
                  width: 100%;
                  text-align: center !important;
                  display: flex;
                  justify-content:center;
                  max-width: 200px;
                  margin: 0px auto;
                  
                ">
                <a href="https://www.facebook.com/scroogegold/" target="_blank" rel="noopener noreferrer" style="
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: inline-block;
                    margin: 5px;
                  "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-facebook-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
                </a>
                <a href="https://twitter.com/Scrooge_Casino" target="_blank" rel="noopener noreferrer" style="
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: grid;
                    place-content: center;
                    margin: 5px;
                  "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-twitter-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
                </a>
                <!-- <a href="https://t.me/scroogecoingold" target="_blank" rel="noopener noreferrer" style="
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: grid;
                    place-content: center;
                    margin: 5px;
                  "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-telegram-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
                </a> -->
                <!-- <a href="https://discord.com/invite/scroogecoin" target="_blank" rel="noopener noreferrer" style="
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: grid;
                    place-content: center;
                    margin: 5px;
                  "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-discord-144.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" />
                </a>
                <a href="https://www.reddit.com/r/scroogecoin/" target="_blank" rel="noopener noreferrer" style="
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: grid;
                    place-content: center;
                    margin: 5px;
                  "><img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/icons8-reddit-120.png" alt="Logo" title="Logo" style="display: block" width="30" height="30" /></a> -->
              </div>
              <h6 style="
                  font-size: 16px;
                  color: rgb(207, 207, 207);
                  margin-top: 20px;
                  font-family: 'Poppins', sans-serif;
                ">
                Need Help ?
              </h6>
              <p style="
                  color: rgb(207, 207, 207);
                  font-size: 14px;
                  font-family: 'Poppins', sans-serif;
                ">
                Please send any feedback or bug reports to
                <a href="mailto:info@scrooge.casino" style="color: #f9ff00; font-family: 'Poppins', sans-serif">info@scrooge.casino</a>
              </p>
              <p style="
                  color: rgb(207, 207, 207);
                  font-size: 14px;
                  font-family: 'Poppins', sans-serif;
                ">
                © 2024 - SCROOGE, LLC- All Rights Reserved
              </p>
            </div>
          </main>
        </div>
      </body>
    
    </html>
        `;
};
export const SEND_INVOICE = (data, hash, from) => {
  console.log("SEND_INVOICE datatattatatata", data);

  return `
  <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;800&display=swap"
    rel="stylesheet" />
  <title>Scrooge Invoice</title>
</head>

<body style="
      background: #fff;
      position: relative;
      min-height: 100vh;
      width: 100%;
    ">
  <div style="
        background: #f3f3f387;
        max-width: 700px;
        width: 100%;
        margin: 0px auto;
        padding: 25px 25px;
        backdrop-filter: blur(8px) saturate(180%);
      ">
    <table>
      <tbody>
        <tr>
          <td>
            <img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/top-hot.png" alt="" style="
            width: 80px;
          " />
          </td>
          <td style="width: 100%;
          text-align: center;
          padding-right: 100px;">
            <h4>Hi ${data?.username} !</h4>
            <p>Thanks for your purchase from Scrooge Casino</p>
          </td>
        </tr>
      </tbody>
    </table>


    <div style="margin-top: 16px;
    text-align: center;">
      <h1 style="font-size: 34px;
      font-weight: 600;
      width: 100%;
      text-align: center;
      color: #333536;">INVOICE</h1>
    </div>

    <table style="    width: 100%;
    margin-top: 20px;">
      <tbody>
        <tr>
          <td style="text-align: left;">
            <p style="color: #333536;">Bill To</p>
            <h4 style="margin: 0px;
            color: #333536;"> ${data?.username} </Contact>
            </h4>
            <p style="color: #333536;">${data?.email} </Contact>
            </p>
            
          </td>
          <td style="text-align: end;">
            <h4 style="color:#333536">
              Invoice Date:
              <span style="font-size:14px;color:#333536;font-weight:500"> ${
                data?.invoicDate
              } </span>
            </h4>
            <h4 style="color:#333536">
              Transaction Id:
              <span style="font-size:14px;color:#333536;font-weight:500"> ${
                data?.txId
              } </span>
            </h4>
            <h4 style="color:#333536">
              Payment Method:
              <span style="font-size:14px;color:#333536;font-weight:500"> ${
                data?.paymentMethod
              }
              </span>
            </h4>
          </td>
        </tr>
      </tbody>
    </table>
    <table style="    width: 100%;
    margin-top: 20px;
    border-top: 1px solid rgb(202,202,202);
    padding-top: 10px;">
      <tbody>
        <tr>
          <th style="text-align:left;color:#333536;     padding-right: 10px;">Package Name</th>
          <th style="text-align:left;color:#333536;     padding-right: 10px;">Price</th>
          <th style="text-align:left;color:#333536;     padding-right: 10px;">Qty.</th>
        </tr>
        <tr>
          <td style="padding-top:20px;text-align:left;color:#333536;     padding-right: 10px;">${numFormatter(
            data?.goldCoinQuantity
          )} ${data?.packageName} </td>
          <td style="padding-top:20px;text-align:left;color:#333536;     padding-right: 10px;"> ${
            data?.purcahsePrice
          } </td>
          <td style="padding-top:20px;text-align:left;color:#333536;     padding-right: 10px;">
            Gold Coin: ${data?.goldCoinQuantity} <br>
            Free Sweep Token: ${data?.tokenQuantity}
          </td>
          
        </tr>
      </tbody>
    </table>
    <table style="width: 100%;
    margin-top: 20px;
    border-top: 1px solid rgb(202,202,202);
    padding-top: 30px;">
    <h5 style="font-size:14px;color:#333536;font-weight:500">All sales are final. SCROOGE LLC has a zero refund policy.</h5>

      <tr>
        <td style="text-align:left;color:#333536">
          <h5>Thank you for your Contribution.</h5>
          <img src="https://scrooge-casino.s3.amazonaws.com/SignupAssets/logo.png" alt="" style="width:200px">
          <br>
          <a href="mailto:
          info@scrooge.casino
          " style="text-decoration:none;color:#333536;font-weight:500"
            mailto:target="_blank">
            info@scrooge.casino
            </a>
        </td>
       
      </tr>
    </table>
    <div style="height: 2px;
    background-color: rgb(232,232,232);
    margin: 40px 0px 10px;"></div>

    <p style="font-size:14px;text-align:center;color:#333536">© 2024 - SCROOGE, LLC- All Rights Reserved</p>


  </div>
</body>

</html>
`;
};
