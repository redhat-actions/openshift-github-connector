import GitHubApp from "./app";

import Log from "../../logger";
import KubeWrapper from "../kube/kube-wrapper";
import { fromb64, tob64 } from "../../util";

type UninstalledGitHubAppMemento = {
  appId: string,
  privateKey: string,
}

type GitHubAppMemento = UninstalledGitHubAppMemento & {
  installationId: string
}

namespace GitHubAppMemento {
  function getSecretName(sessionId: string): string {
    const SECRET_NAME = "actions-connector-app";
    return SECRET_NAME + "-" + sessionId
  }

  export async function save(sessionId: string, memento: GitHubAppMemento): Promise <void> {
    try {
      await deleteSecret(sessionId);
    }
    catch (err) {
      Log.debug(`Failed to clear existing GitHubAppMemento`, err);
    }

    const data = {
      appId: tob64(memento.appId.toString()),
      privateKey: tob64(memento.privateKey),
      installationId: tob64(memento.installationId.toString()),
    };

    const secretResult = await KubeWrapper.instance.client.createNamespacedSecret(KubeWrapper.instance.ns, {
      type: "Opaque",
      metadata: {
        name: getSecretName(sessionId),
        labels: {
          "app.kubernetes.io/part-of": "openshift-actions-connector"
        }
      },
      data,
    });

    Log.info(`Saved app data into `
      + `${secretResult.body.metadata?.namespace}/${secretResult.body.kind}/${secretResult.body.metadata?.name}`
    );
  }

  export async function tryLoad(sessionId: string): Promise<GitHubApp | undefined> {
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
      installationId: fromb64(data.installationId),
    };

    return GitHubApp.create(sessionId, { ...appSecretData }, false);
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
