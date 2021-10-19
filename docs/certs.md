# TLS Certificates
If the cluster uses **self-signed** certs, the system will not trust the certs.

If certs are not properly configured, the server will crash on startup due to not being able to determine the cluster's OAuth server configuration.

## OpenShift Certs to Trust

For in-cluster deployment (using the Helm chart), the serving cert bundle is copied into the pod and trusted at runtime. Refer to [the OpenShift documentation](https://docs.openshift.com/container-platform/4.8/nodes/pods/nodes-pods-secrets.html#nodes-pods-secrets-certificates-about_nodes-pods-secrets).

For local development, copy out that file to your local system:

```sh
oc exec -n openshift-authentication oauth-openshift-<id> -- cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt > ca.crt
```

You can use any pod; they should all have this file.

Move the file somewhere suitable, eg:
```sh
chmod 644 ca.crt
sudo mv ca.crt /var/certs/crc/
```

Refer to this file in `.env.local`:
```properties
# For multiple files, can be comma-separated
TRUST_CERT_FILES=/var/certs/crc/ca.crt
```

This step must be **repeated** when your change your current cluster, so you can keep a directory for each cluster and just change the `.env.local` entry.

Refer to `certs.ts` for the logic that loads these files.

TLS cert checking can be disabled globally using [this hack](https://stackoverflow.com/a/21961005), but this is not a suitable production solution.

## Serving Certificate
The Serving Cert is used by the Connector's HTTPS server. It is then up to the client (eg. the user's browser) to trust the certificate.

Obviously, this would ideally be a certificate issued by a proper authority so it would be trusted by default.

In the cluster, a serving cert is generated using [an annotation on the service](https://docs.openshift.com/container-platform/3.11/dev_guide/secrets.html#service-serving-certificate-secrets), and mounted into the pod at runtime.

For local development, you can generate a certificate using [these instructions](https://letsencrypt.org/docs/certificates-for-localhost/#making-and-trusting-your-own-certificates). Then, copy the cert and key somewhere and add that directory to your `.env.local`. For example, `SERVING_CA_DIRECTORY=/var/certs/localhost`.

See the [Environment](./developing.md#environment) section.
