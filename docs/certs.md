# TLS Certificates
If the cluster uses **self-signed** certs, the OAuth client will not trust the certs.

There are two different TLS keys and CAs used, the Router Cert and the Serving Cert.

TLS cert checking can be disabled globally using [this hack](https://stackoverflow.com/a/21961005), but this is not a suitable production solution.

## Router Cert

The **Router Cert** is used for the OpenShift authentication routes. The

This needs to be trusted by the Connector when it acts as an OAuth **client**, or the TLS handshake will fail and authentication will not work.

For in-cluster deployment (using the Helm chart), copy the serving cert from the `openshift-authentication` namespace into the namespace of your deployment. You must do this **before** installing the Helm chart so the secret exists when the chart is rendering.

```sh
oc get secret v4-0-config-system-router-certs -n openshift-authentication -o yaml | sed 's/namespace: openshift-authentication/namespace: github-connector/g' | oc apply -f-
```
If the secrets exists in the same namespace as the deployment, it will be mounted into the pod and trusted when the server starts. Refer to the `deployment.yaml`.

Repeat this step for the API server cert.
```sh
oc get secret service-network-serving-signer -n openshift-kube-apiserver-operator -o yaml | sed 's/namespace: openshift-kube-apiserver-operator/namespace: github-connector/g' | oc apply -f-
```

For local development, copy out the secret to a file eg:
```
oc get secret v4-0-config-system-router-certs -o jsonpath='{.data.apps-crc\.testing}' | base64 -d
```
Paste the cert into any file, such as `/var/certs/crc/crc.pem`, and refer to that directory in `.env.local`. For example, `SECRETS_CA_DIRECTORY=/var/certs/crc/`.

Do the same for `tls.crt` (but not `tls.key`) from the apiserver cert secret. You can use the same directory or a comma-separated different one.

Refer to `certs.ts` for the logic that loads these files.

You can also disable TLS cert checking altogether by setting `NODE_TLS_REJECT_UNAUTHORIZED=0` in the environment. Obviously, this is not a proper solution and should be only used as a last resort for development.

## Serving Cert
The **Serving Cert** is used by the Connector's HTTPS server. It is then up to the client (eg. the user's browser) to trust the certificate.

Obviously, this would ideally be a certificate issued by a proper authority so it would be trusted by default.

You can generate a certificate for local development using [these instructions](https://letsencrypt.org/docs/certificates-for-localhost/#making-and-trusting-your-own-certificates). Then, copy them somewhere and add that directory to your `.env.local`.

See the [Environment](./developing.md#environment) section.
