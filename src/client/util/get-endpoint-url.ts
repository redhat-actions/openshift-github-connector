/*
function getFromEnv(envVar: string, defaultValue: string): string {
  const envValue = process.env[envVar];
  if (!envValue) {
    // eslint-disable-next-line no-console
    console.warn(`${envVar} not set; using default value`);
    return defaultValue;
  }
  return envValue;
}

let serverUrl: string;
function getServerUrl(): string {
  if (serverUrl) {
    return serverUrl;
  }

  serverUrl = window.location.href;

  if (serverUrl.endsWith("/")) {
    serverUrl = serverUrl.substring(0, serverUrl.length - 1);
  }

  return serverUrl;
}
*/

export default function getEndpointUrl(endpointPath: string): string {
  // this isn't used anymore, but we'll leave this useless function in for now... just in case

  // const endpointUrl = getServerUrl() + endpointPath;

  // eslint-disable-next-line no-console
  // console.log(`Endpoint URL ${endpointUrl}`);

  return endpointPath;
}
