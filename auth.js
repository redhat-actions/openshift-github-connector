const fs = require("fs/promises");

const { Octokit } = require("@octokit/core");
const { createAppAuth } = require("@octokit/auth-app");

(async function() {
  const configStr = (await fs.readFile("/tmp/github-app-config.json")).toString();
  const config = JSON.parse(configStr);

  const auth = {
    ...config,
    // appId: appID,
    // privateKey: pem,
    // installationId: config.installationID,
  };

  console.log("heres the auth", auth);

  const installOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth,
  });

  const result = await installOctokit.request("GET /app");
  console.log(result.data);

  const result2 = await installOctokit.request("GET /repos/{owner}/{repo}/actions/secrets", { owner: 'tetchel', repo: 'express-ts' });
  // const result = await installOctokit.request("GET /app/hook/config");

  // const result = await installOctokit.request("GET /installation/repositories", {
    // installation_id: config.installationID
  // });

  console.log(result2.data);
})();
