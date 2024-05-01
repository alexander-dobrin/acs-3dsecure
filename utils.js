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
  // Преобразуем объект в строку формата "ключ=значение" и объединяем через ;
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

module.exports = { encryptMapiRequestBody, encryptAndEncode };
