import Log from "../../logger";
import SecretUtil from "../kube/secret-util";

type GitHubAppMemento = {
  appId: string,
  client_id: string;
  client_secret: string;
  privateKey: string,
  webhook_secret: string,

  ownerId: string;
}

// export type GitHubAppMementoInstalled = GitHubAppMementoBase & UserData;

// When the data is retrieved from the secret, it may or may not have the install data, so we Partial those fields.
// export type GitHubAppMementoNotInstalled = GitHubAppMementoBase & Partial<UserData>

// don't export here since merged with namespace
// type GitHubAppMemento = GitHubAppMementoInstalled | GitHubAppMementoNotInstalled;

namespace GitHubAppMemento {

  const cache = new Map<string, GitHubAppMemento>();

  // const ANNOTATION_ALLOWED_USERS = "allowed-github-users";

  function getAppSecretName(appId: string) {
    return `github-app-${appId}`;
  }

  export async function saveApp(appMemento: GitHubAppMemento): Promise<void> {
    await SecretUtil.createSecret(getAppSecretName(appMemento.appId), appMemento, { subtype: "app" });
    cache.set(appMemento.appId, appMemento);
  }

  export async function loadApp(appId: string): Promise<GitHubAppMemento | undefined> {
    const secretName = getAppSecretName(appId)

    let appMemento = cache.get(appId);
    if (!appMemento) {
      const secret = await SecretUtil.loadFromSecret<GitHubAppMemento>(secretName);
      if (!secret) {
        return undefined;
      }

      appMemento = secret.data;
      cache.set(appId, appMemento);
    }
    else {
      Log.debug(`Loaded app data from cache`);
    }

    // if (appMemento.ownerId !== asUserId) {
    //   Log.error(`User ${asUserId} tried to access app ${appId} which is owned by user ${appMemento.ownerId}`);
    //   return undefined;
    // }

    return appMemento;
  }

  export async function deleteApp(appId: string): Promise<void> {
    const app = loadApp(appId);
    if (!app) {
      return;
    }

    cache.delete(appId);
    await SecretUtil.deleteSecret(getAppSecretName(appId), true);
  }
}

export default GitHubAppMemento;
