const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const { EventEmitter } = require("events");
const querystring = require("querystring");
const url = require("url");
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
    const isApiCall =
      request.resourceType() === "fetch" && request.method() == "POST";

    if (isApiCall) {
      let body = {};

      if (
        request.headers()["content-type"] ===
        "application/x-www-form-urlencoded"
      ) {
        body = querystring.parse(request.postData());
      } else if (request.headers()["content-type"] === "application/json") {
        body = JSON.parse(request.postData());
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

    const isApiCall =
      request.resourceType() === "fetch" && request.method() == "POST";

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
    // if (requests["/api/common/v1/pay"]) {
    //   break;
    // }
    if (
      requests["/api/common/v1/confirm"] &&
      requests["/api/common/v1/confirm"].response
    ) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  res.json({
    payStatus: requests["/api/common/v1/pay"].response.resultCode,
    confirmStatus: requests["/api/common/v1/confirm"].response.resultCode,
    requests,
  });
});

app.listen(3004, () => {
  console.log("start");
});
