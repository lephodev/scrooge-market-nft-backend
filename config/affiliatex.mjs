import querystring from 'querystring';
import { Curl } from 'node-libcurl';

/*const curl = new Curl();
curl.setOpt('URL', 'www.google.com');
curl.setOpt('FOLLOWLOCATION', true);
curl.on('end', function (statusCode, data, headers) {
  console.info(statusCode);
  console.info('---');
  console.info(data.length);
  console.info('---');
  console.info(this.getInfo( 'TOTAL_TIME'));
  this.close();
});
curl.on('error', curl.close.bind(curl));
curl.perform();*/

const aff = "aff";

let current_page_url = 'https://market.scrooge.casino';
//let buff = new Buffer(data);
let buff_current_page_url = Buffer.from(current_page_url);
let base64data_current_page_url = buff_current_page_url.toString('base64');
let base_url = 'https://scrooge.team';
//let buff = new Buffer(data);
let buff_base_url = Buffer.from(base_url);
let base64data_base_url = buff_base_url.toString('base64');

//console.info(base64data_base_url);

/// Add Order to affiliate system
export function affAddOrder(af_id, order_id, order_total, product_ids, user_id) {
    const customFields= `[{"buyerMongoID":${user_id}}]`;
    //const af_id = "NzdtSnkyMklYTWlXU1hIMDhCdkcydz09-Mi0yMA==";
    const script_name = "general_integration";
    //const current_page_url = base64_encode("https://market.scrooge.casino");
	//const base_url = base64_encode("https://scrooge.team");
    const curl = new Curl();
    curl.setOpt('URL', 'https://scrooge.team/integration/addOrder');
    curl.setOpt('FOLLOWLOCATION', true);
    curl.setopt('CURLOPT_POST', true);
    curl.setopt('CURLOPT_RETURNTRANSFER', true);
    curl.setopt('CURLOPT_HEADER', false);
    curl.setopt('CURLOPT_TIMEOUT', 30);
    curl.setopt('CURLOPT_SSL_VERIFYPEER', false);
    curl.setOpt(
        Curl.option.POSTFIELDS,
        querystring.stringify({
            product_ids: product_ids,
            order_id: order_id,
            order_total: order_total,
            order_currency: "TOK",
            customFields: customFields,
            current_page_url: base64data_current_page_url,
            base_url: base64data_base_url,
            af_id: af_id,
            script_name: script_name,
        })
    );
    curl.on('end', function (statusCode, data, headers) {
      console.info(statusCode);
      console.info('---');
      console.info(data.length);
      console.info('---');
      console.info(this.getInfo( 'TOTAL_TIME'));
      this.close();
    });
    curl.on('error', curl.close.bind(curl));
    curl.perform();
};

export default affAddOrder;