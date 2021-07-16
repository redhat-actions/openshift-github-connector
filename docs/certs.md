# TLS Certificates
If the cluster uses **self-signed** certs, the system will not trust the certs.

The connector must trust the API Server certificate, and the OpenShift Authentication route's certificate.

The connector must also generate its own certificate authority so it can sign its HTTPS traffic.

## OpenShift Certs to Trust

For in-cluster deployment (using the Helm chart), copy the serving cert from the `openshift-authentication` namespace into the namespace of your deployment. You must do this **before** installing the Helm chart so the secret exists when the chart is rendering.

You need administrator permissions to access these namespaces.

```sh
# Authentication route cert
oc get secret v4-0-config-system-router-certs -n openshift-authentication -o yaml | sed 's/namespace: openshift-authentication/namespace: github-connector/g' | oc apply -f-
# API server service cert
oc get secret service-network-serving-signer -n openshift-kube-apiserver-operator -o yaml | sed 's/namespace: openshift-kube-apiserver-operator/namespace: github-connector/g' | oc apply -f-
```

If the secrets exist in the same namespace as the deployment, they will be mounted into the pod and trusted when the server starts. Refer to the `deployment.yaml`.

For local development, copy out these secret to a two files, eg:
```sh
oc get secret v4-0-config-system-router-certs -o jsonpath='{.data.apps-crc\.testing}' | base64 -d > auth-router-cert.pem
oc get secret service-network-serving-signer -n openshift-kube-apiserver-operator -o jsonpath='{.data.tls\.crt}' | base64 -d > api-server.crt
```

Move these two files to any directory, and refer to that directory in `.env.local`. For example, `SECRETS_CA_DIRECTORY=/var/certs/crc/`.

Refer to `certs.ts` for the logic that loads these files.

TLS cert checking can be disabled globally using [this hack](https://stackoverflow.com/a/21961005), but this is not a suitable production solution.

## Serving Certificate
The Serving Cert is used by the Connector's HTTPS server. It is then up to the client (eg. the user's browser) to trust the certificate.

Obviously, this would ideally be a certificate issued by a proper authority so it would be trusted by default.

In the cluster, a serving cert is generated using [an annotation on the service](https://docs.openshift.com/container-platform/3.11/dev_guide/secrets.html#service-serving-certificate-secrets), and mounted into the pod at runtime.

For local development, you can generate a certificate using [these instructions](https://letsencrypt.org/docs/certificates-for-localhost/#making-and-trusting-your-own-certificates). Then, copy the cert and key somewhere and add that directory to your `.env.local`. For example, `SERVING_CA_DIRECTORY=/var/certs/localhost`.

See the [Environment](./developing.md#environment) section.
