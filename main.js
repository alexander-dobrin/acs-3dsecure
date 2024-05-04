const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const querystring = require("querystring");
const { URL } = require("url");
const { seedForm } = require("./utils");

const app = express();

app.use(bodyParser.json("application/json"));

app.post("/pay", async (req, res) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  const requests = {};

  page.on("request", async (request) => {
    const parsedUrl = new URL(request.url());
    const isApiCall = true;

    if (isApiCall) {
      let body = {};

      if (
        request.headers()["content-type"] ===
        "application/x-www-form-urlencoded"
      ) {
        body = querystring.parse(request.postData());
      } else if (request.headers()["content-type"] === "application/json") {
        try {
          body = JSON.parse(request.postData());
        } catch (error) {
          body = {};
        }
      }

      requests[parsedUrl.pathname] = {
        query: parsedUrl.search,
        body,
      };
    }

    request.continue();
  });

  page.on("response", async (response) => {
    const request = response.request();
    const parsedUrl = new URL(request.url());
    const isApiCall = true;

    if (isApiCall) {
      let result = {};

      try {
        if (request.method().toUpperCase() != "OPTION") {
          result = await response.json();
        }
      } catch (err) {
        console.log(parsedUrl.pathname);
      } finally {
        requests[parsedUrl.pathname].response = result;
      }
    }
  });

  await page.goto("https://www.tinkoff.ru/payments/card-to-card/");

  await seedForm(page, req);

  while (true) {
    if (
      requests["/api/common/v1/confirm"] &&
      requests["/api/common/v1/confirm"].response
    ) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  let timeout = false;
  new Promise((resolve, reject) =>
    setTimeout(() => ((timeout = true), resolve(true)), 15_000)
  );
  let cReqBase64;
  let cResBase64;

  while (true) {
    if (requests["/3dsecure/end/"]?.body?.cres || timeout) {
      cReqBase64 = requests["/acs/v2.1.0/mir/challenge/start"].body.creq;
      cResBase64 = requests["/3dsecure/end/"].body.cres;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  let buffer = Buffer.from(cReqBase64, "base64");
  let decodedString = buffer.toString("utf-8");
  const paReqDecoded = decodedString; // cReq

  buffer = Buffer.from(cResBase64, "base64");
  decodedString = buffer.toString("utf-8");
  const paResDecoded = decodedString; // cRes

  let paReq;
  let paRes;

  try {
    paReq = JSON.parse(paReqDecoded);
    paRes = JSON.parse(paResDecoded);

    if (paReq.acsTransID != paRes.acsTransID) {
      res.status(400).json({ error: "ответ подделан" });
    }
  } catch (error) {
    paReq = {};
    paRes = {};
  }

  res.json({
    paReqDecoded,
    paResDecoded,
    paReq,
    paRes,
    payStatus: requests["/api/common/v1/pay"].response.resultCode,
    confirmStatus: requests["/api/common/v1/confirm"].response.resultCode,
    requests,
  });
});

app.listen(3004, () => {
  console.log("start");
});
