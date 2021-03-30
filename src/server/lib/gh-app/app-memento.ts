import GitHubApp from "./app";

import Log from "../../logger";
import KubeWrapper from "../kube/kube-wrapper";
import { fromb64, tob64 } from "../../util";

type GitHubAppMemento = {
  appId: string,
  privateKey: string,
  installationId: string
}

const SECRET_NAME = "actions-connector-app-data";

namespace GitHubAppMemento {
  export async function save(memento: GitHubAppMemento): Promise <void> {
    try {
      await clear();
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
        name: SECRET_NAME,
      },
      data,
    });

    Log.info(`Saved app data into `
      + `${secretResult.body.metadata?.namespace}/${secretResult.body.kind}/${secretResult.body.metadata?.name}`
    );
  }

  export async function tryLoad(): Promise <GitHubApp | undefined> {
    Log.info(`Try to load app config from ${SECRET_NAME}`);

    const secretsList = await KubeWrapper.instance.client.listNamespacedSecret(KubeWrapper.instance.ns);
    const appSecret = secretsList.body.items.find((secret) => secret.metadata?.name === SECRET_NAME);
    if (!appSecret) {
      return undefined;
    }

    const data = appSecret.data;
    if (data == null) {
      Log.error(`Secret ${SECRET_NAME} was found, but did not have any data`);
      return undefined;
    }

    const appSecretData: GitHubAppMemento = {
      appId: fromb64(data.appId),
      privateKey: fromb64(data.privateKey),
      installationId: fromb64(data.installationId),
    };

    return GitHubApp.create({ ...appSecretData });
  }

  export async function clear(): Promise <void> {
    Log.info(`Delete ${SECRET_NAME}`);
    try {
      await KubeWrapper.instance.client.deleteNamespacedSecret(SECRET_NAME, KubeWrapper.instance.ns);
    }
    catch (err) {
      if (err.response.statusCode === 404) {
        Log.info(`${SECRET_NAME} did not exist`)
      }
      else {
        Log.warn(`Error deleting ${SECRET_NAME}`, err);
      }
    }
    GitHubApp.delete();
  }
}

export default GitHubAppMemento;
