const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const { EventEmitter } = require("events");
const querystring = require("querystring");
const url = require("url");

const app = express();

app.use(bodyParser.json("application/json"));

app.post("/pay", async (req, res) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  const paymentRequestsInfo = {
    "https://www.tinkoff.ru/api/common/v1/check_tds": {},
    "https://3ds-ds1.mirconnect.ru/ma": {},
    "https://3ds-ds1.mirconnect.ru/ma/DDC": {},
    "https://www.tinkoff.ru/api/common/v1/3ds_method_notification": {},
    "https://www.tinkoff.ru/api/common/v1/pay": {},
    "https://secure.tinkoff.ru/acs/v2.1.0/mir/challenge/start": {},
    "https://secure.tinkoff.ru/acs/v2.1.0/mir/challenge/finish": {},
    "https://www.tinkoff.ru/3dsecure/end": {},
    // "https://www.tinkoff.ru/api/common/v1/session_status": {},
  };

  page.on("request", async (interceptedRequest) => {
    const parsedTestUrl = url.parse(interceptedRequest.url());
    const testUrlWithoutQuery = `${parsedTestUrl.protocol}//${parsedTestUrl.host}${parsedTestUrl.pathname}`;

    if (interceptedRequest.resourceType() === "fetch") {
      console.log(testUrlWithoutQuery);
    }

    const reqUrl = interceptedRequest.url();
    const reqPath = reqUrl.split("?")[0];

    if (paymentRequestsInfo[reqPath]) {
      paymentRequestsInfo[reqPath].path = reqPath;
      paymentRequestsInfo[reqPath].query = reqUrl.split("?")[1];
      try {
        paymentRequestsInfo[reqPath].body = JSON.parse(
          interceptedRequest.postData()
        );
      } catch (error) {
        paymentRequestsInfo[reqPath].body = querystring.parse(
          interceptedRequest.postData()
        );
      }
    }

    if (reqUrl.split("/").includes("end")) {
      paymentRequestsInfo["https://www.tinkoff.ru/3dsecure/end"].path = reqPath;
      paymentRequestsInfo["https://www.tinkoff.ru/3dsecure/end"].query =
        reqUrl.split("?")[1];
      try {
        paymentRequestsInfo["https://www.tinkoff.ru/3dsecure/end"].body =
          JSON.parse(interceptedRequest.postData());
      } catch (error) {
        paymentRequestsInfo["https://www.tinkoff.ru/3dsecure/end"].body =
          querystring.parse(interceptedRequest.postData());
      }
      // console.log("__", reqUrl);
    }

    interceptedRequest.continue();
  });

  page.on("response", async (response) => {
    const request = response.request();

    if (response.status() >= 300 && response.status() <= 399) {
      // console.log(
      //   `Redirect from ${request.url()} to ${response.headers()["location"]}`
      // );
      // console.log();
    } else {
      if (response.request().resourceType() === "fetch") {
        try {
          const responseJson = await response.json();
          const reqPath = response.request().url().split("?")[0];

          if (paymentRequestsInfo[reqPath]) {
            paymentRequestsInfo[reqPath].response = responseJson;
          }

          if (reqPath.split("/").includes("end")) {
            // console.log("good");
            paymentRequestsInfo[
              "https://www.tinkoff.ru/3dsecure/end"
            ].response = responseJson;
          }
        } catch (error) {}
      }

      if (
        response.url() ===
        "https://secure.tinkoff.ru/acs/v2.1.0/mir/challenge/start"
      ) {
        // console.log(`Matched URL: ${response.url()}`);
        // Здесь можно добавить логику для парсинга ответа
      }
    }
  });

  await page.goto("https://www.tinkoff.ru/payments/card-to-card/");

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 4000);
  });

  // Set screen size
  // await page.setViewport({ width: 1080, height: 1024 });
  const inputIds = await page.$$eval("input", (inputs) =>
    inputs.map((input) => input.id)
  );
  // Type into search box
  let step = 0;
  for (const id of inputIds) {
    if (step == 0) {
      step++;
      continue;
    }
    if (step == 1) {
      await page.type(`#${id}`, req.body.from);
    }
    if (step == 2) {
      await page.type(`#${id}`, req.body.activeTo);
    }
    if (step == 3) {
      await page.click(`#${id}`);
      const digits = req.body.cvc;
      for (const digit of digits) {
        await page.evaluate((digit) => {
          const spans = document.querySelectorAll("span");
          for (const span of spans) {
            if (span.innerHTML == digit) {
              span.click();
            }
          }
        }, digit);
      }
    }
    if (step == 4) {
      await page.type(`#${id}`, req.body.to);
    }
    if (step == 5) {
      await page.type(`#${id}`, req.body.ammount);
    }
    step++;
  }
  // Wait and click on first result
  // Find and click on the button with data attribute 'data-qa-file="Button"'
  const buttonSelector = `[data-qa-file="SubmitButton"]`;
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
  // await page.waitForSelector(buttonSelector, { timeout: 1500 });
  // await page.$eval(buttonSelector, (button) => button.click());
  // await page.waitForSelector(buttonSelector, { timeout: 1500 });
  // await page.click(buttonSelector);

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 4000);
  });

  // console.log(
  //   "8788",
  //   paymentRequestsInfo["https://www.tinkoff.ru/api/common/v1/pay"].response
  //     ?.resultCode ?? "NO CODE"
  // );

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 20000);
  });

  // console.log("8888", paymentRequestsInfo);

  // console.log(
  //   "8788",
  //   paymentRequestsInfo["https://www.tinkoff.ru/api/common/v1/pay"].response
  //     ?.resultCode ?? "NO CODE"
  // );

  res.json({ title: "fullTitl" });
});

app.listen(3004, () => {
  console.log("start");
});
