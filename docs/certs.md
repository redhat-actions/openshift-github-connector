### Fix TLS self-signed cert rejection
If the cluster uses self-signed certs, the OAuth client will not trust the certs.

There are two different TLS keys and CAs used.

TLS cert checking can be disabled globally using [this hack](https://stackoverflow.com/a/21961005), but this is not a suitable production solution.

#### Router CA

The **Router CA** is the CA used for the OpenShift authentication routes.

This needs to be trusted by the Connector when it acts as an OAuth client, or the TLS handshake will fail and authentication will not work.

For in-cluster deployment (using the Helm chart), copy the serving cert from the `openshift-authentication` namespace into the namespace of your deployment.

```sh
oc get secret v4-0-config-system-router-certs -n openshift-authentication -o yaml | sed 's/namespace: openshift-authentication/namespace: github-connector/g' | oc apply -f-
```
If the secrets exists in the same namespace as the deployment, it will be mounted into the pod and trusted when the server starts. Refer to the `deployment.yaml`.

For local development, copy out the secret to a file eg:
```
oc get secret v4-0-config-system-router-certs -o jsonpath='{.data.apps-crc\.testing}' | base64 -d
```
Paste the cert into `/var/certs/crc/crc.pem`, matching `.env.local` `ROUTER_CA_DIRECTORY=/var/certs/crc/`.

Refer to `certs.ts` for the logic that loads this file.

A different CA will be used by the API server, eg `kubernetes.default` or `openshift.default`. Certificate validation for that server can be disabled by setting `INSECURE_TRUST_APISERVER_CERT=true` in the environment.

#### Serving CA
The **Serving CA** is used by the Connector's HTTPS server. It is then up to the client (eg. the user's browser) to trust the certificate.

Obviously, this would ideally be a certificate issued by a proper authority so it would be trusted by default.

You can generate a certificate for local development using [these instructions](https://letsencrypt.org/docs/certificates-for-localhost/#making-and-trusting-your-own-certificates). Then, copy them somewhere and add that directory to your `.env.local`.

See the [Environment](./developing.md#environment) section.
