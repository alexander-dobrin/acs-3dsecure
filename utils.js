const { createHash } = require("crypto");

function encryptMapiRequestBody(body) {
  const keyValuePairs = [];

  for (const [key, value] of Object.entries(body)) {
    if (typeof value == "object") {
      continue;
    }

    keyValuePairs.push({ [key]: value });
  }

  keyValuePairs.push({ Password: process.env.PASSWORD });
  keyValuePairs.sort((a, b) => {
    return Object.keys(a)[0].localeCompare(Object.keys(b)[0]);
  });
  const valuesStr = keyValuePairs.reduce(
    (acc, pair) => (acc += Object.values(pair)[0].toString()),
    ""
  );
  const valuesStrHash = createHash("sha256").update(valuesStr).digest("hex");

  return valuesStrHash;
}

function encryptAndEncode(cardData, publicKeyPath) {
  const dataString = Object.entries(cardData)
    .map(([key, value]) => `${key}=${value}`)
    .join(";");

  const publicKey = fs.readFileSync(publicKeyPath, "utf8");

  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(dataString, "utf8")
  );

  const base64Encoded = encryptedData.toString("base64");

  return base64Encoded;
}

async function requestsInterceptor(page) {}

async function seedForm(page, req) {
  const inputIds = await page.$$eval("input", (inputs) =>
    inputs.map((input) => input.id)
  );
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
}

module.exports = {
  encryptMapiRequestBody,
  encryptAndEncode,
  seedForm,
};
