import fs from "fs/promises";
import path from "path";
import Log from "server/logger";
import syswidecas from "syswide-cas";

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

const CA_DIRS_ENVVAR = "SECRETS_CA_DIRECTORIES";

/**
 * Load certificates for services/routes that this container should trust, as a client.
 */
export async function loadCerts(): Promise<void> {
  Log.info(`Trusting mounted certs`);
  const certsDirs = process.env[CA_DIRS_ENVVAR];
  if (!certsDirs) {
    Log.warn(`process.env.${CA_DIRS_ENVVAR} is not set; skipping certificate loading step`);
    return;
  }

  Log.info(`process.env.${CA_DIRS_ENVVAR} is "${certsDirs}"`);

  const split = certsDirs.split(",");

  await Promise.all(split.map(async (dir) => {
    Log.info(`Reading certs from ${dir}`);

    (await fs.readdir(dir)).forEach((file) => {
      // do not load files starting with ".." (special files that appear when secrets are mounted)
      // and do not load tls.key because it is not a CA
      if (file.startsWith("..") || file === "tls.key") {
        return;
      }

      const fileAbsPath = path.join(dir, file);
      Log.info(`Reading cert from ${fileAbsPath}`);
      syswidecas.addCAs(fileAbsPath);
    });
  }));
}
