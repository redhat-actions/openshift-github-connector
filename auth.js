const fs = require("fs/promises");

const { Octokit } = require("@octokit/core");
const { createAppAuth } = require("@octokit/auth-app");

(async function() {
  const configStr = (await fs.readFile("/tmp/github-app-config.json")).toString();
  const config = JSON.parse(configStr);
  const pem = config.pem;
  const appID = config.id;

  const auth = {
    appId: appID,
    privateKey: pem,
    installationId: config.installationID,
  };

  console.log("heres the auth", auth);

  const installOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth,
  });

  // const result = await installOctokit.request("GET /app");
  const result = await installOctokit.request("GET /app/hook/config");

  // const result = await installOctokit.request("GET /installation/repositories", {
    // installation_id: config.installationID
  // });

  console.log(result.data);
})();
