// https://github.com/redhat-actions/common/wiki/Naming-Guidelines#secret-names
export const DEFAULT_SECRET_NAMES = {
  clusterServerUrl: "OPENSHIFT_SERVER",
  clusterToken: "OPENSHIFT_TOKEN",
  namespace: "OPENSHIFT_NAMESPACE",

  registryPassword: "IMAGE_REGISTRY_PASSWORD",

  synkToken: "SYNK_TOKEN",
  crdaKey: "CRDA_KEY",
};

export interface DefaultSecrets {
  // count: number,
  defaultSecrets: typeof DEFAULT_SECRET_NAMES,
}
