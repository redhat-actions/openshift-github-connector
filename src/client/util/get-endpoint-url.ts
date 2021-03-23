function getFromEnv(envVar: string, defaultValue: string): string {
  const envValue = process.env[envVar];
  if (!envValue) {
    // eslint-disable-next-line no-console
    console.warn(`${envVar} not set; using default value`);
    return defaultValue;
  }
  return envValue;
}

// These should be set by Containerfile
const BACKEND_PROTOCOL_ENVVAR = "REACT_APP_BACKEND_PROTOCOL";
const BACKEND_HOSTNAME_ENVVAR = "REACT_APP_BACKEND_HOSTNAME";
const BACKEND_PORT_ENVVAR = "REACT_APP_BACKEND_PORT";

const BACKEND_PROTOCOL_DEFAULT = "http";
const BACKEND_HOSTNAME_DEFAULT = "localhost";
const BACKEND_PORT_DEFAULT = "3003";

let serverUrl: string;
function getServerUrl(): string {
  if (serverUrl) {
    return serverUrl;
  }

  const backendProtocol = getFromEnv(BACKEND_PROTOCOL_ENVVAR, BACKEND_PROTOCOL_DEFAULT);
  const backendHostname = getFromEnv(BACKEND_HOSTNAME_ENVVAR, BACKEND_HOSTNAME_DEFAULT);
  const backendPort = getFromEnv(BACKEND_PORT_ENVVAR, BACKEND_PORT_DEFAULT);

  serverUrl = `${backendProtocol}://${backendHostname}:${backendPort}`;
  if (serverUrl.endsWith("/")) {
    serverUrl = serverUrl.substring(0, serverUrl.length - 1);
  }
  // eslint-disable-next-line no-console
  console.log(`Backend server URL is ${serverUrl}`);

  return serverUrl;
}

export default function getEndpointUrl(endpointPath: string): string {
  const endpointUrl = getServerUrl() + endpointPath;
  // eslint-disable-next-line no-console
  console.log(`Endpoint URL ${endpointUrl}`);
  return endpointUrl;
}
