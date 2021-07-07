import path from "path";
import fs from "fs/promises";
import syswidecas from "syswide-cas";

import Log from "server/logger";

// https://kubernetes.io/docs/concepts/configuration/secret/#tls-secrets
const CERT_FILENAME = "tls.crt";
const KEY_FILENAME = "tls.key";

const ROUTER_CA_DIR_ENVVAR = "ROUTER_CA_DIRECTORY";
const SERVING_CA_DIR_ENVVAR = "SERVING_CA_DIRECTORY";

export async function loadServingCerts(): Promise<{ cert: string, key: string }> {
  const servingCertsDir = process.env[SERVING_CA_DIR_ENVVAR];
  if (!servingCertsDir) {
    throw new Error(`Cannot add serving certs: process.env.${SERVING_CA_DIR_ENVVAR} is not set`);
  }

  Log.info(`Reading serving cert data from ${servingCertsDir}`);

  const certFile = path.join(servingCertsDir, CERT_FILENAME);
  const keyFile = path.join(servingCertsDir, KEY_FILENAME);

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

export async function loadRouterCerts(): Promise<void> {
  const routerCaDir = process.env[ROUTER_CA_DIR_ENVVAR];
  if (!routerCaDir) {
    Log.warn(`process.env.${ROUTER_CA_DIR_ENVVAR} is not set; skipping router certificate step`);
    return;
  }

  Log.info(`Reading router cert from ${routerCaDir}`);

  const routerDirContents = await fs.readdir(routerCaDir);
  syswidecas.addCAs(routerCaDir);
  Log.info(`Certs loaded: ${routerDirContents.join(", ")}`);
}
