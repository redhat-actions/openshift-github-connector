const fs = require("fs/promises");
const crypto = require("crypto");

(async function() {
  const pem = (await fs.readFile("/tmp/gh-app.pem")).toString();

  const sha = crypto.createHash("sha256").update(pem).digest("hex");
  const md5 = crypto.createHash("md5").update(pem).digest("hex");

  console.log(`hashed pem of length ${pem.length}:\nsha256: ${sha}\nmd5: ${md5}`);
})();
