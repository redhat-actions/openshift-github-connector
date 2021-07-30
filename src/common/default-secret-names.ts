// https://github.com/redhat-actions/common/wiki/Naming-Guidelines#secret-names
export const DEFAULT_SECRET_NAMES = {
  clusterServerUrl: "OPENSHIFT_SERVER",
  clusterToken: "OPENSHIFT_TOKEN",
  namespace: "OPENSHIFT_NAMESPACE",

  registryPassword: "REGISTRY_PASSWORD",
};

export interface DefaultSecrets {
  count: number,
  defaultSecrets: typeof DEFAULT_SECRET_NAMES,
}

export function getDefaultSecretNames(): DefaultSecrets {
  const count = Object.keys(DEFAULT_SECRET_NAMES).length;
  return {
    count,
    defaultSecrets: DEFAULT_SECRET_NAMES,
  };
}
