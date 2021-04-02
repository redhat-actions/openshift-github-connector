import GitHubApp from "./app";

import Log from "../../logger";
import KubeWrapper from "../kube/kube-wrapper";
import { fromb64, tob64 } from "../../util/server-util";

export type GitHubAppMementoBase = {
  appId: string,
  privateKey: string,
  webhookSecret: string,
}

export type GitHubAppMementoInstalled = GitHubAppMementoBase & {
  installationId: string;
}

export type GitHubAppMementoNotInstalled = GitHubAppMementoBase & {
  installationId?: string;
}

// don't export here since merged with namespace
type GitHubAppMemento = GitHubAppMementoInstalled | GitHubAppMementoNotInstalled;

namespace GitHubAppMemento {
  function getSecretName(sessionId: string): string {
    const SECRET_NAME = "actions-connector-app";
    return SECRET_NAME + "-" + sessionId
  }

  export async function save(sessionId: string, memento: GitHubAppMemento): Promise<void> {
    try {
      await deleteSecret(sessionId);
    }
    catch (err) {
      // swallow
    }

    const data = {
      appId: tob64(memento.appId),
      privateKey: tob64(memento.privateKey),
      webhookSecret: tob64(memento.webhookSecret),
    };

    if (memento.installationId) {
      (data as any).installationId = tob64(memento.installationId);
    }

    const appName = "openshift-actions-connector";

    const secretResult = await KubeWrapper.instance.client.createNamespacedSecret(KubeWrapper.instance.ns, {
      type: "Opaque",
      metadata: {
        name: getSecretName(sessionId),
        labels: {
          app: appName,
          "app.kubernetes.io/part-of": appName,
        },
      },
      data,
    });

    Log.info(`Saved INITIAL app data into `
      + `${secretResult.body.metadata?.namespace}/${secretResult.body.kind}/${secretResult.body.metadata?.name}`
    );
  }

  export async function savePostInstall(sessionId: string, installationId: string | number): Promise<void> {
    const data = {
      installationId: tob64(installationId.toString()),
    };

    const patchResult = await KubeWrapper.instance.client.patchNamespacedSecret(
      getSecretName(sessionId),
      KubeWrapper.instance.ns,
      { data },
      // seriously? https://github.com/kubernetes-client/javascript/issues/19#issuecomment-582886605
      undefined, undefined, undefined, undefined,
      { headers: { 'content-type': 'application/strategic-merge-patch+json' } }
    );

    Log.info(`Patched installation ID into `
      + `${patchResult.body.metadata?.namespace}/${patchResult.body.kind}/${patchResult.body.metadata?.name}`
    );
  }

  export async function tryLoad(sessionId: string): Promise<GitHubAppMemento | GitHubAppMementoNotInstalled | undefined> {
    const secretName = getSecretName(sessionId);
    Log.info(`Try to load app config from ${secretName}`);

    const secretsList = await KubeWrapper.instance.client.listNamespacedSecret(KubeWrapper.instance.ns);
    const appSecret = secretsList.body.items.find((secret) => secret.metadata?.name === secretName);
    if (!appSecret) {
      return undefined;
    }

    const data = appSecret.data;
    if (data == null) {
      Log.error(`Secret ${secretName} was found, but did not have any data`);
      await deleteSecret(sessionId);
      return undefined;
    }

    const appSecretData: GitHubAppMemento = {
      appId: fromb64(data.appId),
      privateKey: fromb64(data.privateKey),
      webhookSecret: fromb64(data.webhookSecret),
      installationId: data.installationId ? fromb64(data.installationId) : undefined,
    };

    return appSecretData;
  }

  async function deleteSecret(sessionId: string): Promise<void> {
    const secretName = getSecretName(sessionId);

    Log.info(`Trying to delete ${secretName}`);
    try {
      await KubeWrapper.instance.client.deleteNamespacedSecret(secretName, KubeWrapper.instance.ns);
      Log.info(`Deleted ${secretName}`);
    }
    catch (err) {
      if (err.response.statusCode === 404) {
        Log.info(`${secretName} did not exist`)
      }
      else {
        Log.warn(`Error deleting ${secretName}`, err);
      }
    }
  }

  export async function clear(sessionId: string): Promise<void> {
    try {
      await deleteSecret(sessionId);
    }
    finally {
      GitHubApp.delete(sessionId);
    }
  }
}

export default GitHubAppMemento;
