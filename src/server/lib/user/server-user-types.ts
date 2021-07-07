import k8s from "@kubernetes/client-node";
import { ConnectorGitHubUserInfo, OpenShiftUserInfo } from "common/types/user-types";
import TokenUtil from "./token-util";

export interface UserSessionData {
  info: OpenShiftUserInfo,
  token: TokenUtil.TokenInfo,
}

export type UserMementoSaveable = {
  uid: string;
  imageRegistries: string,
} & Partial<{
  githubUserId: string,
  githubUserName: string,
  githubUserType: string,
  installedAppId: string,
  installationId: string,
}>

export type UserMemento = {
  uid: string;
  imageRegistries: string;

  githubUserInfo?: ConnectorGitHubUserInfo;

  installationInfo?: {
    appId: number,
    installationId: number,
  },
};

/**
 * https://docs.openshift.com/container-platform/4.6/rest_api/user_and_group_apis/user-user-openshift-io-v1.html
 */
export interface OpenShiftUserCR extends k8s.KubernetesObject {
  kind: "User",
  apiVersion: "config.openshift.io/v1",
  /**
   * The identities are the identity provider for this user + ":" + the ID for this user on that IDP.
   * eg. "DevSandbox:123456" or "developer:kubeadmin" (CRC)
   */
  identities: string[],
  /**
   * eg. system:authenticated, system:authenticated:oauth, system:cluster-admins (kubeadmin)
   */
  groups: string[],
}

/**
 * https://docs.openshift.com/container-platform/4.6/rest_api/config_apis/oauth-config-openshift-io-v1.html
 */
export interface OpenShiftOAuthCR extends k8s.KubernetesObject {
  kind: "OAuth",
  apiVersion: "user.openshift.io/v1",
  spec: Partial<{
    identityProviders: Record<string, unknown>[],
    templates: Record<string, unknown>
    tokenConfig: {
      accessTokenMaxAgeSeconds: number,
    },
  }>,
}

export interface AddGitHubAppInstallationInfo {
  appId: number,
  installationId: number,
}
