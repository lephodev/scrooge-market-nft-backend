import Authorize from "authorizenet";
const { APIContracts: ApiContracts, APIControllers: ApiControllers } =
  Authorize;

const getRandomId = (min = 0, max = 500000) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num.toString().padStart(6, "0");
};

export function createAnAcceptPaymentTransaction(body, user, callback) {
  var merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(process.env.AUTHORIZE_LOGIN_ID);
  merchantAuthenticationType.setTransactionKey(
    process.env.AUTHORIZE_TRANSACTION_KEY
  );

  var opaqueData = new ApiContracts.OpaqueDataType();
  opaqueData.setDataDescriptor(body.dataDescriptor);
  opaqueData.setDataValue(body.dataValue);

  var paymentType = new ApiContracts.PaymentType();
  paymentType.setOpaqueData(opaqueData);

  var orderDetails = new ApiContracts.OrderType();
  orderDetails.setInvoiceNumber(`INV-${getRandomId(1000, 9999999999999)}`);
  orderDetails.setDescription(body.item.description);

  var billTo = new ApiContracts.CustomerAddressType();
  billTo.setFirstName(user.firstName);
  billTo.setLastName(user.lastName);
  billTo.setEmail(user.email);

  var customer = new ApiContracts.CustomerDataType();
  customer.setEmail(user.email);

  var lineItem_id1 = new ApiContracts.LineItemType();
  lineItem_id1.setItemId(body.item.id);
  lineItem_id1.setName(body.item.name);
  lineItem_id1.setDescription(body.item.description);
  lineItem_id1.setQuantity("1");
  lineItem_id1.setUnitPrice(parseFloat(body.item.price));

  var lineItemList = [];
  lineItemList.push(lineItem_id1);

  var lineItems = new ApiContracts.ArrayOfLineItem();
  lineItems.setLineItem(lineItemList);

  var userField_a = new ApiContracts.UserField();
  userField_a.setName("userId");
  userField_a.setValue(user._id.toString());

  var userFieldList = [];
  userFieldList.push(userField_a);

  var userFields = new ApiContracts.TransactionRequestType.UserFields();
  userFields.setUserField(userFieldList);

  var transactionSetting1 = new ApiContracts.SettingType();
  transactionSetting1.setSettingName("duplicateWindow");
  transactionSetting1.setSettingValue("120");

  var transactionSetting2 = new ApiContracts.SettingType();
  transactionSetting2.setSettingName("recurringBilling");
  transactionSetting2.setSettingValue("false");

  var transactionSettingList = [];
  transactionSettingList.push(transactionSetting1);
  transactionSettingList.push(transactionSetting2);

  var transactionSettings = new ApiContracts.ArrayOfSetting();
  transactionSettings.setSetting(transactionSettingList);

  var transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(
    ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setLineItems(lineItems);
  transactionRequestType.setUserFields(userFields);
  transactionRequestType.setOrder(orderDetails);
  transactionRequestType.setBillTo(billTo);
  transactionRequestType.setCustomer(customer);
  transactionRequestType.setAmount(parseFloat(body.item.price));
  transactionRequestType.setTransactionSettings(transactionSettings);

  var createRequest = new ApiContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthenticationType);
  createRequest.setTransactionRequest(transactionRequestType);

  //pretty print request
  console.log(JSON.stringify(createRequest.getJSON(), null, 2));

  var ctrl = new ApiControllers.CreateTransactionController(
    createRequest.getJSON()
  );
  //Defaults to sandbox
  ctrl.setEnvironment("https://api.authorize.net/xml/v1/request.api");

  ctrl.execute(function () {
    var apiResponse = ctrl.getResponse();

    var response = new ApiContracts.CreateTransactionResponse(apiResponse);

    //pretty print response
    console.log(JSON.stringify(response, null, 2));

    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        if (response.getTransactionResponse().getMessages() != null) {
          console.log(
            "Successfully created transaction with Transaction ID: " +
              response.getTransactionResponse().getTransId()
          );
          console.log(
            "Response Code: " +
              response.getTransactionResponse().getResponseCode()
          );
          console.log(
            "Message Code: " +
              response
                .getTransactionResponse()
                .getMessages()
                .getMessage()[0]
                .getCode()
          );
          console.log(
            "Description: " +
              response
                .getTransactionResponse()
                .getMessages()
                .getMessage()[0]
                .getDescription()
          );
        } else {
          console.log("Failed Transaction.");
          if (response.getTransactionResponse().getErrors() != null) {
            console.log(
              "Error Code: " +
                response
                  .getTransactionResponse()
                  .getErrors()
                  .getError()[0]
                  .getErrorCode()
            );
            console.log(
              "Error message: " +
                response
                  .getTransactionResponse()
                  .getErrors()
                  .getError()[0]
                  .getErrorText()
            );
          }
        }
      } else {
        console.log("Failed Transaction. ");
        if (
          response.getTransactionResponse() != null &&
          response.getTransactionResponse().getErrors() != null
        ) {
          console.log(
            "Error Code: " +
              response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorCode()
          );
          console.log(
            "Error message: " +
              response
                .getTransactionResponse()
                .getErrors()
                .getError()[0]
                .getErrorText()
          );
        } else {
          console.log(
            "Error Code: " + response.getMessages().getMessage()[0].getCode()
          );
          console.log(
            "Error message: " + response.getMessages().getMessage()[0].getText()
          );
        }
      }
    } else {
      console.log("Null Response.");
    }

    callback(response);
  });
}

export function getAnAcceptPaymentPage(body, callback) {
  var merchantAuthenticationType =
    new ApiContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(process.env.AUTHORIZE_LOGIN_ID);
  merchantAuthenticationType.setTransactionKey(
    process.env.AUTHORIZE_TRANSACTION_KEY
  );

  var transactionRequestType = new ApiContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(
    ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequestType.setAmount(20);

  var setting1 = new ApiContracts.SettingType();
  setting1.setSettingName("hostedPaymentButtonOptions");
  setting1.setSettingValue('{"text": "Pay"}');

  var setting2 = new ApiContracts.SettingType();
  setting2.setSettingName("hostedPaymentOrderOptions");
  setting2.setSettingValue('{"show": false}');

  var settingList = [];
  settingList.push(setting1);
  settingList.push(setting2);

  var alist = new ApiContracts.ArrayOfSetting();
  alist.setSetting(settingList);

  var getRequest = new ApiContracts.GetHostedPaymentPageRequest();
  getRequest.setMerchantAuthentication(merchantAuthenticationType);
  getRequest.setTransactionRequest(transactionRequestType);
  getRequest.setHostedPaymentSettings(alist);

  //console.log(JSON.stringify(getRequest.getJSON(), null, 2));

  var ctrl = new ApiControllers.GetHostedPaymentPageController(
    getRequest.getJSON()
  );
  ctrl.setEnvironment("https://api.authorize.net/xml/v1/request.api");

  ctrl.execute(function () {
    var apiResponse = ctrl.getResponse();

    var response = new ApiContracts.GetHostedPaymentPageResponse(apiResponse);

    //pretty print response
    console.log(JSON.stringify(response, null, 2));
    ctrl.setEnvironment("https://api.authorize.net/xml/v1/request.api");

    // ctrl.execute(function () {
    //   var apiResponse = ctrl.getResponse();

    //   var response = new ApiContracts.CreateTransactionResponse(apiResponse);

    //   //pretty print response
    //   console.log(JSON.stringify(response, null, 2));

    if (response != null) {
      if (
        response.getMessages().getResultCode() ==
        ApiContracts.MessageTypeEnum.OK
      ) {
        console.log("Hosted payment page token :");
        console.log(response.getToken());
      } else {
        //console.log('Result Code: ' + response.getMessages().getResultCode());
        console.log(
          "Error Code: " + response.getMessages().getMessage()[0].getCode()
        );
        console.log(
          "Error message: " + response.getMessages().getMessage()[0].getText()
        );
      }
    } else {
      console.log("Null response received");
    }

    callback(response);
  });
}

// if (require.main === module) {
//   getAnAcceptPaymentPage(function () {
//     console.log("getAnAcceptPaymentPage call complete.");
//   });
// }
