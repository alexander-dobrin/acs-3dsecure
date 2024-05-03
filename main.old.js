const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const { EventEmitter } = require("events");
const querystring = require("querystring");

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
    // "https://www.tinkoff.ru/api/common/v1/session_status": {},
  };

  page.on("request", async (interceptedRequest) => {
    const reqUrl = interceptedRequest.url();
    const reqPath = reqUrl.split("?")[0];

    if (paymentRequestsInfo[reqPath]) {
      paymentRequestsInfo[reqPath].path = reqPath;
      paymentRequestsInfo[reqPath].query = reqUrl.split("?")[1];
      paymentRequestsInfo[reqPath].body = JSON.stringify(
        interceptedRequest.postData()
      );
      console.log(interceptedRequest.response());
    }

    interceptedRequest.continue();
  });

  await page.goto("https://www.tinkoff.ru/payments/card-to-card/");

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
  await page.waitForSelector(buttonSelector, { timeout: 1500 });
  await page.$eval(buttonSelector, (button) => button.click());
  await page.waitForSelector(buttonSelector, { timeout: 1500 });
  await page.click(buttonSelector);

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
  console.log(paymentRequestsInfo);

  res.json({ title: "fullTitl" });
});

app.listen(3004, () => {
  console.log("start");
});
