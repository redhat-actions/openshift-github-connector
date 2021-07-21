import fs from "fs/promises";
import path from "path";
import Log from "server/logger";
import syswidecas from "syswide-cas";
import { fileExists, isProduction } from "./server-util";

// https://kubernetes.io/docs/concepts/configuration/secret/#tls-secrets
interface TLSSecretData {
  cert: string,
  key: string,
}

const CERT_FILENAME = "tls.crt";
const KEY_FILENAME = "tls.key";

const SERVING_CA_DIR_ENVVAR = "SERVING_CA_DIRECTORY";

/**
 * Load and return certificates that our server will use to sign its own HTTPS responses.
 */
export async function loadServingCerts(): Promise<TLSSecretData> {
  const servingCertsDir = process.env[SERVING_CA_DIR_ENVVAR];
  if (!servingCertsDir) {
    throw new Error(`Cannot add serving certs: process.env.${SERVING_CA_DIR_ENVVAR} is not set`);
  }

  Log.info(`Reading serving cert data`);
  return loadTLSSecretData(servingCertsDir);
}

export async function loadTLSSecretData(dir: string): Promise<TLSSecretData> {
  Log.info(`Reading TLS secret data from ${dir}`);

  const certFile = path.join(dir, CERT_FILENAME);
  const keyFile = path.join(dir, KEY_FILENAME);

  Log.info(`Reading cert from ${certFile}`);
  Log.info(`Reading key from ${keyFile}`);

  const [ cert, key ] = await Promise.all([
    fs.readFile(certFile),
    fs.readFile(keyFile),
  ]);

  return {
    cert: cert.toString(),
    key: key.toString(),
  };
}

const CA_FILES_ENVVAR = "TRUST_CERT_FILES";

const serviceAccountMountDir = "/var/run/secrets/kubernetes.io/serviceaccount/";

// https://docs.openshift.com/container-platform/3.11/dev_guide/secrets.html#service-serving-certificate-secrets
const SERVICE_CA_FILE = path.join(serviceAccountMountDir, "service-ca.crt");
const CA_FILE = path.join(serviceAccountMountDir, "/ca.crt");

/**
 * Load certificates for services/routes that this container should trust, as a client.
 */
export async function loadCerts(): Promise<void> {
  Log.info(`Loading certs`);

  if (await fileExists(SERVICE_CA_FILE, isProduction())) {
    Log.info(`Reading service certs from ${SERVICE_CA_FILE}`);
    syswidecas.addCAs(SERVICE_CA_FILE);
  }

  if (await fileExists(CA_FILE, isProduction())) {
    Log.info(`Reading certs from ${CA_FILE}`);
    syswidecas.addCAs(CA_FILE);
  }

  const certFiles = process.env[CA_FILES_ENVVAR];
  if (!certFiles) {
    return;
  }

  Log.info(`process.env.${CA_FILES_ENVVAR} is "${certFiles}"`);

  const split = certFiles.split(",");

  await Promise.all(split.map(async (file) => {
    Log.info(`Reading certs from ${file}`);
    syswidecas.addCAs(file);
  }));
}
