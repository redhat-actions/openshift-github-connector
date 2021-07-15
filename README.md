# OpenShift GitHub Connector

The OpenShift GitHub Connector provides a webapp on your OpenShift cluster which connects GitHub repositories to your OpenShift cluster, and automates setting up GitHub Actions for OpenShift.

## Installing on OpenShift
See [the chart](./chart/openshift-github-connector).
The inputs are described in [`values.yaml`](./chart/openshift-github-connector/values.yaml).

Install from the root of the repo as follows:
```sh
helm upgrade --install github-connector \
  chart/openshift-github-connector \
  --set clusterAppsSubdomain=apps.<your-openshift-server>.com
  --set clusterApiServer=$(oc whoami --show-server)
```

You need to be a cluster administrator to create an `OAuthClient` since it is a cluster-scoped resource.

See the [`values.yaml`](./chart/values.yaml) for an explanation of these values and the others you may set.

## Developing
See [developing.md](./docs/developing.md).
