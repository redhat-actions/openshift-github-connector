import { V1ObjectMeta, V1Secret } from "@kubernetes/client-node";

import Log from "../../logger";
import { Stringable } from "../../../common/common-util";
import HttpConstants from "../../../common/http-constants";
import { GitHubRepoId } from "../../../common/types/github-types";
import { getFriendlyHTTPError, objValuesFromb64, objValuesTob64, toValidK8sName } from "../../util/server-util";
import KubeWrapper, { ServiceAccountToken } from "./kube-wrapper";

const APP_NAME = "openshift-actions-connector";

const ANNOTATION_CREATED_AT = "created-at";
const ANNOTATION_UPDATED_AT = "updated-at";
const ANNOTATION_SERVICEACCOUNT_NAME = "kubernetes.io/service-account.name";

namespace SecretUtil {
  const SECRET_LABELS = {
    app: APP_NAME,
    "app.kubernetes.io/part-of": APP_NAME,
  };

  export async function createSecret(
    secretName: string, data: Record<string, Stringable>,
    labels: { [key: string]: string, subtype: string }
  ): Promise<void> {
    await SecretUtil.deleteSecret(secretName, false);

    Log.info(`Creating secret ${secretName}`);

    const secretResult = await KubeWrapper.instance.coreClient.createNamespacedSecret(KubeWrapper.instance.ns, {
      type: "Opaque",
      metadata: {
        name: secretName,
        creationTimestamp: new Date(),
        annotations: {
          [ANNOTATION_CREATED_AT]: new Date().toISOString(),
          [ANNOTATION_UPDATED_AT]: new Date().toISOString(),
          // ...annotations,
        },
        labels: {
          ...SECRET_LABELS,
          ...labels,
        },
      },
      data: objValuesTob64(data),
    });

    Log.info(`Created ${secretResult.body.metadata?.namespace}/${secretResult.body.kind}/${secretResult.body.metadata?.name}`);
  }

  export async function patchSecret(secretName: string, data: Record<string, Stringable>): Promise<V1Secret> {
    const secrets = await KubeWrapper.instance.coreClient.listNamespacedSecret(KubeWrapper.instance.ns);

    const secretExists = secrets.body.items.find((secret) => secret.metadata?.name === secretName);

    if (!secretExists) {
      throw new Error(`Secret "${secretName}" not found in namespace "${KubeWrapper.instance.ns}"`);
    }

    const patchResult = await KubeWrapper.instance.coreClient.patchNamespacedSecret(
      secretName,
      KubeWrapper.instance.ns, {
        metadata: {
          [ANNOTATION_UPDATED_AT]: new Date().toISOString(),
        },
        data: objValuesTob64(data),
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

  export async function loadFromSecret<T extends Record<string, any>>(
    secretName: string
  ): Promise<({ data: T, metadata: V1ObjectMeta }) | undefined> {

    const ns = KubeWrapper.instance.ns;

    Log.info(`Loading secret ${secretName}`);

    const secretsList = await KubeWrapper.instance.coreClient.listNamespacedSecret(ns);
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

  export async function deleteSecret(secretName: string, throwOnErr: boolean): Promise<boolean> {
    Log.info(`Trying to delete ${secretName}`);
    try {
      await KubeWrapper.instance.coreClient.deleteNamespacedSecret(secretName, KubeWrapper.instance.ns);
      Log.info(`Deleted ${secretName}`);
      return true;
    }
    catch (err) {
      if (err.response?.statusCode === 404) {
        Log.info(`${secretName} did not exist`)
        return false;
      }

      if (throwOnErr) {
        throw err;
      }
      else {
        Log.warn(`Error deleting ${secretName}`, err);
        return false;
      }
    }
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

  const LABEL_CREATED_FOR_REPO_ID = "created-for-github-repo-id";

  export async function createSAToken(serviceAccountName: string, repo: GitHubRepoId,
    meta: {
      createdByApp: string,
      createdByAppId: string,
      createdByUser: string,
      createdByUserId: string,
    }
  ): Promise<ServiceAccountToken> {
		const saTokenSecretName = toValidK8sName(`${serviceAccountName}-token-${repo.id}`);

    const labels = {
      ...SECRET_LABELS,
      [LABEL_CREATED_FOR_REPO_ID]: repo.id.toString(),
      "created-for-github-repo": toValidK8sName(`${repo.owner}/${repo.name}`),
      "created-by-github-app-id": meta.createdByAppId,
      "created-by-github-app": toValidK8sName(meta.createdByApp),
      "created-by-github-user-id": meta.createdByUserId,
      "created-by-github-user": toValidK8sName(meta.createdByUser),
      subtype: "repo-serviceaccount-token",
    };

    let saTokenSecretBody;
    try {
      const existing = await SecretUtil.loadFromSecret(saTokenSecretName);
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
        const createSATokenRes = await KubeWrapper.instance.coreClient.createNamespacedSecret(
          KubeWrapper.instance.ns, {
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

        saTokenSecretBody = createSATokenRes.body;
        Log.info(
          `Created serviceaccount token secret `
          + `${saTokenSecretBody.metadata?.namespace}/${saTokenSecretBody.kind}/${saTokenSecretBody.metadata?.name}`
        );
      }
      catch (err) {
        throw getFriendlyHTTPError(err);
      }
    }

    Log.info(`SA Token secret data keys are "${Object.keys(saTokenSecretBody || {}).join(", ")}"`);

    const token = saTokenSecretBody.data?.token;
    if (!token) {
      throw new Error(`data.token was not provided in response body`);
    }

    const metadata = saTokenSecretBody.metadata;
    if (!metadata) {
      throw new Error(`No metadata provided in create serviceaccount token response`);
    }

    const namespace = metadata.namespace;
    if (!namespace) {
      throw new Error(`Service account namespace was not present in metadata`);
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
      token,
    };
	}
}

export default SecretUtil;
