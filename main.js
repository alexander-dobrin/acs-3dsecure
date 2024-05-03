const dotenv = require("dotenv");
const { encryptMapiRequestBody } = require("./utils");
const parser = require("xml2js");

dotenv.config();

// const pay = async (req, res) => {
//   const InitRequestBody = {
//     TerminalKey: "TinkoffBankTest",
//     Amount: 1000,
//     OrderId: 20986163,
//     Description: "Подарочная карта на 1000 рублей",
//     DATA: {
//       Phone: "+71234567890",
//       Email: "a@test.com",
//     },
//     Receipt: {
//       Email: "a@test.ru",
//       Phone: "+79031234567",
//       Taxation: "osn",
//       Items: [
//         {
//           Name: "Наименование товара 1",
//           Price: 1000,
//           Quantity: 1,
//           Amount: 1000,
//           Tax: "vat10",
//           Ean13: "303130323930303030630333435",
//         },
//       ],
//     },
//   };

//   const InitToken = encryptMapiRequestBody(InitRequestBody);
//   InitRequestBody.Token = InitToken;
//   const InitResponse = await fetch("https://securepay.tinkoff.ru/v2/Init", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(InitRequestBody),
//   });
//   const InitResponseJson = await InitResponse.json();

//   const GetStateRequestBody = {
//     TerminalKey: "TinkoffBankTest",
//     PaymentId: InitResponseJson.PaymentId,
//   };
//   const GetStateToken = encryptMapiRequestBody(GetStateRequestBody);
//   GetStateRequestBody.Token = GetStateToken.toLocaleLowerCase();
//   const GetStateResponse = await fetch(
//     "https://securepay.tinkoff.ru/v2/GetState",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(GetStateRequestBody),
//     }
//   );
//   const GetStateResponseJson = await GetStateResponse.json();

//   // 3ds auth required
//   if (GetStateResponseJson.Status !== "AUTHORIZED") {
//     return;
//   }

//   const cardData = {
//     PAN: "4300000000000777",
//     ExpDate: "0519",
//     CardHolder: "IVAN PETROV",
//     CVV: "111",
//   };

//   const publicKeyPath = "path/to/publicKey.pem";
//   const encodedCardData = encryptAndEncode(cardData, publicKeyPath);

//   const FinishAuthorizeRequestBody = {
//     TerminalKey: "TinkoffBankTest",
//     PaymentId: 700001702044,
//     Token: "f5a3be479324a6d3a4d9efa0d02880b77d04a91758deddcbd9e752a6df97cab5",
//     IP: "2011:0db8:85a3:0101:0101:8a2e:0370:7334",
//     SendEmail: true,
//     Source: "cards",
//     DATA: {
//       threeDSCompInd: "Y",
//       language: "RU",
//       timezone: "-300",
//       screen_height: "1024",
//       screen_width: "967",
//       cresCallbackUrl: "www.callbackurl.ru",
//       colorDepth: "48",
//       javaEnabled: "false",
//     },
//     InfoEmail: "qwerty@test.com",
//     EncryptedPaymentData: "string",
//     CardData: encodedCardData,
//     Amount: 10000,
//     deviceChannel: "02",
//     Route: "ACQ",
//   };
//   const FinishAuthorizeToken = encryptMapiRequestBody(
//     FinishAuthorizeRequestBody
//   );
//   FinishAuthorizeRequestBody.Token = FinishAuthorizeToken.toLocaleLowerCase();
//   const FinishAuthorizeResponse = await fetch(
//     "https://securepay.tinkoff.ru/v2/FinishAuthorize",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(GetStateRequestBody),
//     }
//   );
//   const FinishAuthorizeResponseJson = await FinishAuthorizeResponse.json();

//   // 3ds auth required
//   if (FinishAuthorizeResponseJson.Status !== "3DS_CHECKING") {
//     return;
//   }

//   const { PaReq, ASCUrl, MD } = FinishAuthorizeResponseJson;

//   const formData = {
//     MD,
//     PaReq,
//     CardData: encodedCardData,
//   };
//   const params = new URLSearchParams(formData);
//   const response = await fetch(ASCUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: params,
//   });

//   /*
//   EXAMPLE VALUE
// <ThreeDSecure>
//   <Message id="999">
//     <VEReq>
//       <version>1.0.2</version>
//       <pan>4444333322221111</pan>
//       <Merchant>
//         <acqBIN>411111</acqBIN>
//         <merID>99000001</merID>
//         <password>99000001</password>
//       </Merchant>
//       <Browser>
//         <deviceCategory>0</deviceCategory>
//         <accept>/*</accept>
//         <userAgent>curl/7.27.0</userAgent>
//       </Browser>
//     </VEReq>
//   </Message>
// </ThreeDSecure>
//   */
//   const { PaRes } = await response.json();

//   const decodedPaRes = Buffer.from(mockPaRes, "base64").toString("utf-8");

//   parser.parseString(decodedPaRes, (err, result) => {
//     if (err) {
//       console.error("parse xml", err);
//     } else {
//       console.log("result", result);
//       const status = result.PaRes.Browser.userAgent[0];
//       console.log("user agent:", status);
//     }
//   });

//   const submitFormData = {
//     MD,
//     PaRes,
//     PaymentId,
//     TerminalKey,
//     Token,
//   };
//   const submitParams = new URLSearchParams(submitFormData);
//   const submit3DsResponse = await fetch(ASCUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: submitParams,
//   });
//   const { Status } = await submit3DsResponse.json();

//   if (Status != "CONFIRMED") {
//     return;
//   }

//   // success, redirect
// };

// pay();

// const pareq =
//   "eyJtZXNzYWdlVmVyc2lvbiI6IjIuMS4wIiwidGhyZWVEU1NlcnZlclRyYW5zSUQiOiI3NDQxZTg5ZS1iMDljLTQyMWQtYTI2OC0xNTg1NjM0N2I1MmQiLCJhY3NUcmFuc0lEIjoiMjViODk2OTAtZWZjNy00MDM2LWJmZDMtOWE0YzMzYzFhODQ4IiwiY2hhbGxlbmdlV2luZG93U2l6ZSI6IjA1IiwibWVzc2FnZVR5cGUiOiJDUmVxIn0";

const base64String =
  "eyJ0aHJlZURTU2VydmVyVHJhbnNJRCI6IjRmYzcyZDVhLWZkNmYtNGI5MS1hMmRmLTdlNzdiNTNmMmIwMiIsImFjc1RyYW5zSUQiOiI5ZWQ2ZjA1MC0zMDA3LTQ4MTQtYWJjYy1lYzRmMDZkNTU0MGIiLCJtZXNzYWdlVHlwZSI6IkNSZXMiLCJtZXNzYWdlVmVyc2lvbiI6IjIuMS4wIiwidHJhbnNTdGF0dXMiOiJZIn0";

const buffer = Buffer.from(base64String, "base64");
const decodedString = buffer.toString("utf-8");

console.log(decodedString);
