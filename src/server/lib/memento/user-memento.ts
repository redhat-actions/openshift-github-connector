import Log from "server/logger";
import SecretUtil from "server/lib/kube/secret-util";

type GitHubUserMemento = {
  userId: string;
  userName: string;
  appId: string;
  installationId: string;
}

namespace GitHubUserMemento {

  // export type ServiceAccount = {
  //   serviceAccountName: string;
  //   serviceAccountToken: string;
  // };

  const cache = new Map<string, GitHubUserMemento>();

  function getUserSecretName(userId: string) {
    return `github-user-${userId}`;
  }

  export async function saveUser(userMemento: GitHubUserMemento): Promise<void> {
    await SecretUtil.createSecret(getUserSecretName(userMemento.userId), userMemento, { subtype: "user" });
    Log.debug(`Update user data in cache`);
    cache.set(userMemento.userId, userMemento);
  }

  export async function loadUser(userId: string): Promise<GitHubUserMemento | undefined> {
    if (cache.has(userId)) {
      Log.debug(`Loaded user data from cache`);
      return cache.get(userId);
    }

    const secret = await SecretUtil.loadFromSecret<GitHubUserMemento>(getUserSecretName(userId));
    if (!secret) {
      return undefined;
    }

    const userMemento = secret.data;
    cache.set(userMemento.userId, userMemento);
    return secret.data;
  }

  // export async function addServiceAccount(userId: string, serviceAccount: GitHubUserMemento.ServiceAccount): Promise<void> {
    // await MementoUtil.patchSecret(getUserSecretName(userId), serviceAccount);
  // }
}

export default GitHubUserMemento;
