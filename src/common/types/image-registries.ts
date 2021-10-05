namespace ImageRegistry {
  export const Registries = {
    GHCR: {
      description: "GitHub Container Registry",
      hostname: "ghcr.io",
    },
    QUAY: {
      description: "Quay",
      hostname: "quay.io",
    },
    DOCKERHUB: {
      description: "Docker Hub",
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
    ghcrUseGitHubToken?: boolean,
  }

  export interface Info extends ImageRegistry.Inputs {
    id: string,
    fullPath: string,
    fullPathAsUser: string,
  }

  export type List = ImageRegistry.Info[];
}

export default ImageRegistry;
