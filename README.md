# OpenShift Actions Connector

Coming soon...

## Installing on OpenShift
See [the chart](./containerize/chart/openshift-actions-connector).
The inputs are described in [`values.yaml`](./containerize/chart/openshift-actions-connector/values.yaml).

Install from the root of the repo as follows:
```sh
helm upgrade --install actions-connector \
  containerize/chart/openshift-actions-connector \
  --set clusterAppsSubdomain=apps.<your-openshift-server>.com
  --set clusterApiServer=$(oc whoami --show-server)
```

You do not need any permissions other than in your own namespace.

## Developing locally

### Log in and set namespace

You have to be logged into a cluster and have your current context's namespace set:

```sh
oc config set-context $(kubectl config current-context) --namespace="$namespace"
```

### Set up a service account

When running locally you have to create, configure, and link a service account to the app (in OpenShift this is done by the helm chart) as per [the wiki](https://github.com/redhat-actions/oc-login/wiki/Using-a-Service-Account-for-GitHub-Actions).

then

```sh
oc create sa github-actions
oc policy add-role-to-user edit -z github-actions -z
```

### Set up the environment
If you haven't yet, run `yarn install`.

Create a file called `.env.local` next to the existing `.env`. This is environment variables that will be loaded at server startup, and will not be committed to SCM.

Set the session secrets to two different UUIDs. You can generate them using:
```sh
node -e \
'const uuid = require("uuid");
console.log(
  `SESSION_SECRET=${uuid.v4()}
SESSION_STORE_SECRET=${uuid.v4()}`
)'

```

Your `.env.local` should look like this:
```
SESSION_SECRET=<uuid>
SESSION_STORE_SECRET=<another uuid>
CONNECTOR_SERVICEACCOUNT_NAME=<service account from above>
```

Then run `yarn dev` to run the development server.

---

There is no story for live reload on OpenShift yet.

To build and push the container images you can use the scripts in `package.json`, though I haven't added a way to override the registry user or path.

### Project Structure

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
- https://getbootstrap.com/docs/4.0/getting-started/introduction/

### Backend
- https://docs.github.com/en/developers/apps/creating-a-github-app-from-a-manifest
- https://docs.github.com/en/rest/reference
- https://docs.github.com/en/rest/reference/permissions-required-for-github-apps
