# Developing locally

The steps below are to prepare your cluster to serve as a development environment. Most of these steps will have to be performed once per cluster you develop against.

## Log in and set namespace

You have to be logged into a cluster and have your current context's namespace set:

```sh
oc config set-context $(kubectl config current-context) --namespace="$namespace"
```

## Yarn install
`yarn install`

## Set up a service account

When running locally you have to create, configure, and link a service account to the app (in OpenShift this is done by the helm chart) as per [the wiki](https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions).

then

```sh
oc create sa github-connector-dev-sa
oc policy add-role-to-user edit -z github-connector-dev-sa
```

This service account name is then passed through the environment, in the `deployment.yaml` or `.env`.

## OpenShift OAuth
1. Use [Telepresence](https://www.telepresence.io/docs/latest/howtos/intercepts/) to proxy the OpenShift API server out of the cluster to your local development environment. Otherwise, it will not know how to resolve the `openshift.default` host.
2. Create an OAuthClient:
```sh
# One-liner to generate a UUID
export OAUTH_CLIENT_SECRET=$(node -e 'console.log(require("uuid").v4())') && echo "$OAUTH_CLIENT_SECRET"
cat <<EOF | oc create -f-
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  # must match .env OAUTH_CLIENT_ID
  name: github-connector-oauth-client-dev
# substitute your own uuid
secret: ${OAUTH_CLIENT_SECRET}
redirectURIs:
	# You can put any number of callback URLs in this array
  # the env callback must be one of these
  - https://localhost:3000/api/v1/auth/callback
grantMethod: auto
EOF
```
3. Add the client secret UUID to `.env.local` as `OAUTH_CLIENT_SECRET=<the OAUTH_CLIENT_SECRET UUID>`

### Debugging OAuth Problems
Passport is poor at error reporting. Make sure that:
- The redirect URI is in the OAuthClient object, as above.
- The redirect URI in the environment matches the OAuthClient.
- The client ID and client secret in the environment match the OAuthClient.
- The cluster's authentication route's TLS certificates are trusted by the connector (see [TLS Certificates](./certs.md))

## TLS Certificates

Refer to [certs.md](./certs.md).

<a id="environment"></a>

## Set up the environment
Create a file called `.env.local` next to the existing `.env`. This is environment variables that will be loaded at server startup, and will not be committed to SCM.

Set the session secrets to two different UUIDs.

Your `.env.local` should look like this:

```properties
SESSION_SECRET=<any uuid>
SESSION_STORE_SECRET=<another uuid>
OAUTH_CLIENT_SECRET=<uuid from OAuthClient above>
CONNECTOR_SERVICEACCOUNT_NAME=<service account from above>

# See certs.md
SERVING_CA_DIRECTORY=/var/certs/localhost

# Steps below are necessary only if your cluster uses untrusted TLS certs
# See certs.md
ROUTER_CA_DIRECTORY=/var/certs/crc/
INSECURE_TRUST_APISERVER_CERT: true
```

Then run `yarn dev` to run the development server.

## Project Structure

The backend is in Express, and the frontend is in React using create-react-app (CRA). Code can be shared across the stack from the `common/` directory.

Be careful about adding package dependencies here because they will be webpacked separately into the frontend and backend. Modules must be compatible with both and should not be large.

The structure is adapted from [this blog post](https://spin.atomicobject.com/2020/08/17/cra-express-share-code), and the boilerplate code is in [this repository](https://github.com/gvanderclay/cra-express).


### Debugging
There are debug configurations in launch.json which should work with VS Code.

If you want to use "Attach to Chrome" to debug the React you must launch chrom(e|ium) with `google-chrome --remote-debugging-port=9222`. This seems to cause VS Code to leak memory so you may have to restart Code every so often.

Use the [React devtools browser extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) to view components and state in the browser when developing.

### Gotchas
CRA seems to have problems if you rename or delete a TypeScript file. It will keep trying to compile the old one. Restarting the development server fixes it.

Similarly, if you edit the ESLint config file, the change will not get picked up until a dev server restart.

If the CRA server is not restarting because a file is errored, you have to edit the file that it thinks is errored and save it, even if the fix for the error is in another file.

The `tsconfig.json` in the root of the repository is used for the client (this is the directory structure CRA expects). The server `tsconfig` is `src/server/tsconfig.json`, while the webpack config for the server is at the repository root.

Sometimes VS Code intellisense stops working altogether, particularly when using the absolute import paths created by the `paths` tsconfig entries. Restarting VS Code may fix it; re-running `yarn dev` may also fix it.

## Resources

### Frontend
- https://react-bootstrap.github.io/components/alerts/
- https://getbootstrap.com/docs/5.0/getting-started/introduction/

### Backend
- https://docs.github.com/en/rest/reference
- https://docs.github.com/en/developers/apps/creating-a-github-app-from-a-manifest
- https://docs.github.com/en/rest/reference/permissions-required-for-github-apps
