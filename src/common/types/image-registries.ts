namespace ImageRegistries {
  export const GHCR_HOSTNAME = "ghcr.io";

  export const Registries = {
    GHCR: {
      description: "GitHub Container Registry",
      enabled: true,
    },
    OPENSHIFT: {
      description: "OpenShift Integrated Registry",
      enabled: false,

    },
    OTHER: {
      description: "another image registry",
      enabled: false,
    },
  };

  export type Type = keyof typeof Registries;

  export interface Info {
    type: Type,
    hostname: string,
  }
}

export default ImageRegistries;
