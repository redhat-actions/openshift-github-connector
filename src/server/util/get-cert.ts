import path from "path";
import fs from "fs/promises";

import Log from "server/logger";

// the key and cert are volume-mounted into the pod and are valid for the service domain
const CERTS_DIR = path.resolve("/", "var", "serving-cert");
const CERT_FILENAME = "tls.crt";
const KEY_FILENAME = "tls.key";

export default async function getCertData(): Promise<{ cert: string, key: string }> {
  Log.info(`Reading cert data from "${CERTS_DIR}"`);

  const [ cert, key ] = await Promise.all([
    fs.readFile(path.join(CERTS_DIR, CERT_FILENAME)),
    fs.readFile(path.join(CERTS_DIR, KEY_FILENAME)),
  ]);

  return {
    cert: cert.toString(),
    key: key.toString(),
  };
}
