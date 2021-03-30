const jwt = require("jsonwebtoken");
const fs = require("fs/promises");

(async function() {
    const configStr = (await fs.readFile("/tmp/github-app-config.json")).toString();
    const config = JSON.parse(configStr);
    const pem = config.pem;
    const appID = config.id;

    const now = Math.round(Date.now() / 1000);
    const payload = {
        iat: now,
        exp: now + (9 * 60 + 59),       // max lifetime for access token endpoint is 10 min
        iss: appID,
    };

    // console.log("PAYLOAD", payload);

    const token = jwt.sign(payload, pem, { algorithm: "RS256" });

    console.log(token);
})();
