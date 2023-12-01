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
                Welcome to Scrooge, LLC
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
                  We have received your redemption request of <br>
                  Token: ${prize} <br>
                  USD: $ ${prize / 100} <br>

                  We will review the request and process it as quick as we can.  This process is typically completed inside 24H. Keep in mind, we do not process redemptions on weekends or holidays.
                  <br>
                  If this is your first time redeeming and you need some guidance, please <a href="https://market.scrooge.casino/static/media/SCROOGE%20Redemption%20Manual.60fd5a4a7bf48ee3a8e1.pdf" target="_blank">download</a> the instructional PDF here.
                  <br>
                  If you have any further questions regarding the process, feel free to reach out to us on Facebook Messenger.

                <!-- We have received your redemption request for ${prize} Tokens, we will process this as soon as we can and send you an email upon completion.                 -->
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
                © 2023 - SCROOGE, LLC- All Rights Reserved
              </p>
            </div>
          </main>
        </div>
      </body>
    
    </html>
        `;
};

export const APPROVE_REDEEM_REQUEST = (username, hash, from) => {
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
                Welcome to Scrooge, LLC
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
                <br> Token: ${prize} 
                <br> USD: $ ${prize / 100}
                <br> Has been processed.  The Scrooge cryptocurrency is now in your ${WalletAddress} The following is the successful transaction hash from the transfer: ${hash}
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
                  If this is your first time redeeming and you need some guidance, please <a href="https://market.scrooge.casino/static/media/SCROOGE%20Redemption%20Manual.60fd5a4a7bf48ee3a8e1.pdf" target="_blank">download</a> the instructional PDF here
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
                © 2023 - SCROOGE, LLC- All Rights Reserved
              </p>
            </div>
          </main>
        </div>
      </body>
    
    </html>
        `;
};