namespace ImageRegistry {
  export const Registries = {
    GHCR: {
      description: "GitHub Container Registry",
      enabled: true,
      hostname: "ghcr.io",
    },
    QUAY: {
      description: "Quay",
      enabled: true,
      hostname: "quay.io",
    },
    DOCKERHUB: {
      description: "Docker Hub",
      enabled: true,
      hostname: "docker.io",
    },
    /*
    OPENSHIFT: {
      description: "OpenShift Integrated Registry",
      enabled: false,
      hostname: undefined,
    },
    */
    OTHER: {
      description: "Other",
      enabled: true,
      hostname: undefined,
    },
  };

  export type Type = keyof typeof Registries;

  export interface Inputs {
    type: Type,
    hostname: string,
    namespace: string,
    username: string,
    passwordOrToken: string,
  }

  export interface Info extends ImageRegistry.Inputs {
    id: string,
    fullPath: string,
  }

  export type List = ImageRegistry.Info[];
}

export default ImageRegistry;
