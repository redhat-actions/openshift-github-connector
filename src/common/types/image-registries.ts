export const GHCR_HOSTNAME = "ghcr.io";

export const ImageRegistries = {
  GHCR: {
    description: "GitHub Container Registry",
    enabled: true,
  },
  OPENSHIFT: {
    description: "OpenShift Integrated Registry",
    enabled: false,

  },
  OTHER: {
    description: "another image registry (DockerHub, Quay.io, etc)",
    enabled: false,
  },
};

export type ImageRegistryType = keyof typeof ImageRegistries;

export interface ImageRegistryInfo {
  type: ImageRegistryType,
  hostname: string,
}
