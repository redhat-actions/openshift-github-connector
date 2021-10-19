import * as k8s from "@kubernetes/client-node";

import Log from "server/logger";
import HttpConstants from "common/http-constants";
import { GitHubRepoId } from "common/types/gh-types";
import { getFriendlyHTTPError, objValuesFromb64, objValuesTob64 } from "server/util/server-util";
import KubeWrapper from "./kube-wrapper";
import { toValidK8sName } from "common/common-util";

const APP_NAME = "openshift-github-connector";

const ANNOTATION_CREATED_AT = "created-at";
const ANNOTATION_UPDATED_AT = "updated-at";
const ANNOTATION_SERVICEACCOUNT_NAME = "kubernetes.io/service-account.name";

export type SimpleValue = number | string | boolean | undefined;

namespace SecretUtil {
  export const CONNECTOR_LABEL_NAMESPACE = "github-connector.openshift.io";
  // type ConnectorLabelName = `${typeof CONNECTOR_LABEL_NAMESPACE}/${string}`;

  const SUBTYPE_LABEL = `${CONNECTOR_LABEL_NAMESPACE}/subtype`;

  export enum Subtype {
    APP = "app",
    USER = "user",
    SA_TOKEN = "repo-serviceaccount-token",
    INSTALL_TOKEN = "github-installation-token",
  }

  export function getSubtypeSelector(subtype: Subtype): string {
    return `${SUBTYPE_LABEL}=${subtype}`;
  }


  export function getSecretLabels(subtype: Subtype, createdBy: string): Record<string, string> {
    return {
      // "app.kubernetes.io/part-of": APP_NAME,
      "app.kubernetes.io/managed-by": APP_NAME,
      [SUBTYPE_LABEL]: subtype,
      [CONNECTOR_LABEL_NAMESPACE + "/created-by"]: toValidK8sName(createdBy),
    };
  }

  /**
   *
   * @returns A k8s client authenticated using the service account token in the pod.
   * Use this to manage "internal" secrets using the service account's permissions, in the connector namespace.
   */
  export function getSAClient(): k8s.CoreV1Api {
    return KubeWrapper.instance.config.makeApiClient(k8s.CoreV1Api);
  }

  export function getSAName(): string {
    return KubeWrapper.instance.serviceAccountName;
  }

  /**
   *
   * @returns The namespaced used for the connector's internal "storage secrets". NOT for user secrets!
   */
  export function getStorageSecretsNamespace(): string {
    return KubeWrapper.instance.namespace;
  }

  export async function createSecret(
    client: k8s.CoreV1Api,
    namespace: string,
    secretName: string,
    data: Record<string, SimpleValue>,
    createdBy: string,
    subtype: Subtype,
    options: {
      labels?: Record<string, string>,
      annotations?: Record<string, string>,
    } = {}
  ): Promise<void> {
    Log.info(`Creating secret ${secretName}`);

    const now = new Date().toISOString();

    const secretResult = await client.createNamespacedSecret(namespace, {
      type: "Opaque",
      metadata: {
        name: secretName,
        creationTimestamp: new Date(),
        annotations: {
          [ANNOTATION_CREATED_AT]: now,
          [ANNOTATION_UPDATED_AT]: now,
          ...options.annotations,
        },
        labels: {
          ...options.labels,
          ...getSecretLabels(subtype, createdBy),
        }
      },
      data: objValuesTob64(data, false),
    });

    Log.info(`Created ${secretResult.body.metadata?.namespace}/${secretResult.body.kind}/${secretResult.body.metadata?.name}`);
  }

  export async function patchSecret(
    client: k8s.CoreV1Api,
    namespace: string,
    secretName: string,
    data: Record<string, SimpleValue>,
  ): Promise<k8s.V1Secret> {
    const secrets = await client.listNamespacedSecret(namespace);

    const secretExists = secrets.body.items.find((secret) => secret.metadata?.name === secretName);

    if (!secretExists) {
      throw new Error(`Secret "${secretName}" not found in namespace "${namespace}"`);
    }

    const patchResult = await client.patchNamespacedSecret(
      secretName,
      namespace, {
        metadata: {
          [ANNOTATION_UPDATED_AT]: new Date().toISOString(),
        },
        data: objValuesTob64(data, true),
      },
      // seriously? https://github.com/kubernetes-client/javascript/issues/19#issuecomment-582886605
      undefined, undefined, undefined, undefined,
      { headers: { [HttpConstants.Headers.ContentType]: HttpConstants.ContentTypes.JsonPatch } }
    );

    Log.info(`Patched key(s) "${Object.keys(data).join(", ")}" into `
      + `${patchResult.body.metadata?.namespace}/${patchResult.body.kind}/${patchResult.body.metadata?.name}`
    );

    return patchResult.body;
  }

  export async function loadFromSecret<T extends Record<string, string | undefined>>(
    client: k8s.CoreV1Api,
    namespace: string,
    secretName: string
  ): Promise<({ data: T, metadata: k8s.V1ObjectMeta }) | undefined> {

    Log.info(`Loading secret ${secretName}`);

    const secretsList = await client.listNamespacedSecret(namespace);
    const secret = secretsList.body.items.find((secret) => secret.metadata?.name === secretName);
    if (!secret) {
      return undefined;
    }

    const data = secret.data as Record<string, string> | undefined;
    if (data == null || Object.keys(data).length === 0) {
      Log.error(`Secret ${secretName} was found, but did not have any data`);
      // await SecretUtil.deleteSecret(secretName, false);
      return undefined;
    }

    const dataDecoded = objValuesFromb64(data) as T;

    if (!secret.metadata) {
      throw new Error(`No metadata in secret "${secretName}"!`);
    }

    return {
      data: dataDecoded,
      metadata: secret.metadata,
    }
  }

  export async function deleteSecret(client: k8s.CoreV1Api, namespace: string, secretName: string): Promise<boolean> {
    Log.info(`Trying to delete ${secretName}`);
    try {
      await client.deleteNamespacedSecret(secretName, namespace);
      Log.info(`Deleted ${secretName}`);
      return true;
    }
    catch (err) {
      if (err.response?.statusCode === 404) {
        Log.info(`${secretName} did not exist`)
        return false;
      }

      throw err;
    }
  }

  export async function getSecretsMatchingSelector(client: k8s.CoreV1Api, namespace: string, labelSelector: string): Promise<k8s.V1SecretList> {
    Log.info(`Get secrets in namespace ${namespace} with selector ${labelSelector}`);

    const secrets = await client.listNamespacedSecret(
      namespace,
      undefined, undefined, undefined, undefined,
      labelSelector,
    );

    return secrets.body;
  }

  /*
  function toLabelSelector(labels: Record<string, string>): string {
    let selector = Object.entries(labels).reduce((prev, [ k, v ]) => { return `${prev},${k}=${v}`; }, "")
    if (selector.startsWith(",")) {
      selector = selector.substring(1);
    }
    return selector;
  }
  */

  type ServiceAccountToken = {
    namespace: string;
    serviceAccountName: string;
    token: string;
    tokenSecretName: string;
  }

  const LABEL_CREATED_FOR_REPO_ID = CONNECTOR_LABEL_NAMESPACE + "/repo-id";

  export async function createSAToken(
    userClient: k8s.CoreV1Api,
    namespace: string,
    serviceAccountName: string,
    repo: GitHubRepoId,
    createdBy: string,
  ): Promise<ServiceAccountToken> {
		const saTokenSecretName = toValidK8sName(`github-repo-sa-token-${repo.id}`);

    const labels = {
      ...getSecretLabels(Subtype.SA_TOKEN, createdBy),
      [LABEL_CREATED_FOR_REPO_ID]: repo.id.toString(),
      [CONNECTOR_LABEL_NAMESPACE + "/repo"]:  toValidK8sName(`${repo.full_name}`),
    };

    let saTokenSecretBody;
    try {
      const existing = await SecretUtil.loadFromSecret(userClient, namespace, saTokenSecretName);
      if (existing?.metadata.labels) {
        const match = existing.metadata.labels[LABEL_CREATED_FOR_REPO_ID] === labels[LABEL_CREATED_FOR_REPO_ID];
        if (match) {
          saTokenSecretBody = existing;
          Log.info(`SA Token "${saTokenSecretName}" already existed and matched repository label, reusing.`)
        }
      }
    }
    catch (err) {
      if (err.response.statusCode !== 404) {
        throw getFriendlyHTTPError(err);
      }
      Log.info(`${saTokenSecretName} does not exist`);
    }

    if (!saTokenSecretBody) {
      try {
        Log.info(`Creating SA Token "${saTokenSecretName}`);
        const createSATokenRes = await userClient.createNamespacedSecret(
          namespace, {
            metadata: {
              name: saTokenSecretName,
              annotations: {
                [ANNOTATION_SERVICEACCOUNT_NAME]: serviceAccountName,
              },
              labels,
            },
            type: "kubernetes.io/service-account-token",
          }
        );

        Log.info(
          `Created serviceaccount token secret `
          + `${createSATokenRes.body.metadata?.namespace}/${createSATokenRes.body.kind}/${createSATokenRes.body.metadata?.name}`
        );

        let newSecret = await SecretUtil.loadFromSecret(userClient, namespace, saTokenSecretName);
        let tries = 1;
        while (!newSecret && tries++ <= 10) {
          // after the SA token secret is created, it takes a few moments for the controller to update it with its SA token data.
          Log.info(`Failed to get secret after it was just created, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 500));

          newSecret = await SecretUtil.loadFromSecret(userClient, namespace, saTokenSecretName);

        }
        if (!newSecret) {
          throw new Error(`Failed to load secret "${saTokenSecretName}" after it was just created`);
        }
        Log.info(`Got SA token secret after ${tries} tries`);
        saTokenSecretBody = newSecret;
      }
      catch (err) {
        throw getFriendlyHTTPError(err);
      }
    }

    Log.info(`SA Token secret data keys are "${Object.keys(saTokenSecretBody.data || {}).join(", ")}"`);

    const token = saTokenSecretBody.data?.token;
    if (!token) {
      throw new Error(`data.token was not provided in response body`);
    }

    const metadata = saTokenSecretBody.metadata;
    if (!metadata) {
      throw new Error(`No metadata provided in create serviceaccount token response`);
    }

    const annotations = metadata.annotations;
    const serviceAccountAnnotationName = annotations ? annotations[ANNOTATION_SERVICEACCOUNT_NAME] : undefined;
    if (!serviceAccountAnnotationName) {
      throw new Error(`Service account annotation was not present in metadata, should have been "${serviceAccountName}"`);
    }

    const secretCreatedName = metadata.name;
    if (!secretCreatedName) {
      throw new Error(`Secret name was not provided in response body, should have been "${saTokenSecretName}"`);
    }

		return {
      serviceAccountName,
      namespace,
      tokenSecretName: saTokenSecretName,
      token: token.toString(),
    };
	}
}

export default SecretUtil;
