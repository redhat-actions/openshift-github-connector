import { V1ObjectMeta, V1Secret } from "@kubernetes/client-node";
import HttpConstants from "../../../common/http-constants";

import Log from "../../logger";
import { objValuesFromb64, objValuesTob64, Stringable } from "../../util/server-util";
import KubeWrapper from "../kube/kube-wrapper";

namespace MementoUtil {

  const APP_NAME = "openshift-actions-connector";

  const SECRET_LABELS = {
    app: APP_NAME,
    "app.kubernetes.io/part-of": APP_NAME,
  };

  const ANNOTATION_UPDATED_AT = "updated-at";

  export async function createSecret(
    secretName: string, data: Record<string, Stringable>,
    labels: { [key: string]: string, subtype: string }
  ): Promise<void> {
    await MementoUtil.deleteSecret(secretName, false);

    Log.info(`Creating secret ${secretName}`);

    const secretResult = await KubeWrapper.instance.coreClient.createNamespacedSecret(KubeWrapper.instance.ns, {
      type: "Opaque",
      metadata: {
        name: secretName,
        creationTimestamp: new Date(),
        annotations: {
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
      await MementoUtil.deleteSecret(secretName, false);
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
      if (err.response.statusCode === 404) {
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
}

export default MementoUtil;
