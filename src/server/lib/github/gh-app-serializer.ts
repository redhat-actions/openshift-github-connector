import { toValidK8sName, removeUndefined } from "common/common-util";
import { GitHubAppAuthData } from "common/types/gh-types";
import Log from "server/logger";
import { getFriendlyHTTPError, fromb64 } from "server/util/server-util";
import SecretUtil from "../kube/secret-util";
import User from "../user/user";
import UserSerializer from "../user/user-serializer";
import GitHubApp from "./gh-app";
import { getAppOctokit, getGitHubHostname } from "./gh-util";

const cache = new Map<number, GitHubApp> ();

/**
 * The data we must save in order to be able to reconstruct this GitHub app.
 * This amounts to the secrets, so we can authenticate and retrieve the data
 * from the app api endpoint.
 */
 interface AppMemento {
  [key: string]: string,

  id: string,
  name: string,
  // appName: string,
  // appSlug: string,

  client_id: string,
  client_secret: string,
  pem: string,
  webhook_secret: string,

  // ownerId: number,
  // authorizedUsers: string,
}

namespace GitHubAppSerializer {

	export async function create(authData: GitHubAppAuthData): Promise<GitHubApp> {
		const octokit = getAppOctokit(authData);

		let configNoSecrets ;
		try {
			configNoSecrets = await GitHubApp.getAppConfig(octokit);
		}
		catch (err) {
			if (err.response.status === 404) {
				throw new Error(
					`Received ${getFriendlyHTTPError(err)}; app has likely been deleted. `
					+ `Delete the secret "${getAppSecretName(authData.id)}" to remove the app from the cluster.`
				);
			}
			throw err;
		}

		const config = {
			...authData,
			...configNoSecrets
		};

		const githubHostname = await getGitHubHostname();

		const app = new GitHubApp(
			githubHostname,
			config,
			octokit,
		);

		await save(app);

		return app;
	}

	export async function save(app: GitHubApp): Promise<void> {
		const appId = app.config.id;

		const memento: AppMemento = {
			id: appId.toString(),
			name: app.config.name,
			// appSlug: app.config.slug,
			ownerId: app.config.owner.id.toString(),

			client_id: app.config.client_id,
			client_secret: app.config.client_secret,
			pem: app.config.pem,
			webhook_secret: app.config.webhook_secret,
		};

		await SecretUtil.deleteSecret(
			SecretUtil.getSAClient(),
			SecretUtil.getStorageSecretsNamespace(),
			getAppSecretName(appId),
		);

		// Log.debug("APP MEMENTO", memento);

		await SecretUtil.createSecret(
			SecretUtil.getSAClient(),
			SecretUtil.getStorageSecretsNamespace(),
			getAppSecretName(appId),
			memento,
			SecretUtil.getSAName(),
			SecretUtil.Subtype.APP,
			{
				[SecretUtil.CONNECTOR_LABEL_NAMESPACE + "/app"]: toValidK8sName(app.config.slug),
			}
		);

		Log.info(`Saving app ${app.config.name} into cache`);
		cache.set(appId, app);
	}

	export async function load(appId: number): Promise<GitHubApp | undefined> {
		Log.info(`Load app ID ${appId}`);
		const secretName = getAppSecretName(appId)

		const cachedApp = cache.get(appId);
		if (cachedApp) {
			Log.debug(`Loaded app data from cache`);
			return cachedApp;
		}

		const secret = await SecretUtil.loadFromSecret<AppMemento>(SecretUtil.getSAClient(), SecretUtil.getStorageSecretsNamespace(), secretName);
		if (!secret) {
			Log.warn(`Tried to load app ${appId} from secret but it was not found`);
			return undefined;
		}

		const appAuth = {
			...secret.data,
			id: Number(secret.data.id),
		};

		const app = await create(appAuth);

		const activeUsers = await UserSerializer.loadAllActiveUsers();
		const owner = activeUsers.find((user) => user.githubUserInfo?.id === app.ownerId);
		if (owner) {
			owner.addOwnsApp(app);
		}

		save(app);

		return app;
	}

	export async function loadAll(): Promise<GitHubApp[] | undefined> {
		Log.info(`Load all apps`);
		const matchingSecrets = await SecretUtil.getSecretsMatchingSelector(
			SecretUtil.getSAClient(),
			SecretUtil.getStorageSecretsNamespace(),
			SecretUtil.getSubtypeSelector(SecretUtil.Subtype.APP)
		);

		if (matchingSecrets.items.length === 0) {
			return undefined;
		}

		const appIds = removeUndefined(matchingSecrets.items.map((appSecret) => {
			const data = appSecret.data as AppMemento;
			const appId = data.id;

			if (appId) {
				const asNumber = Number(fromb64(appId));
				if (isNaN(asNumber)) {
					Log.error(`Secret ${appSecret.metadata?.name} contains a bad app ID ${appId}`)
					return undefined;
				}
				return asNumber;
			}
			Log.error(`Secret ${appSecret.metadata?.name} missing app ID`)
			return undefined;
		}));


		Log.info(`App IDs to be loaded are ${appIds.join(", ")}`);

		const apps = removeUndefined(
			await Promise.all(appIds.map((appId) => load(appId)))
		);

		return apps;
	}

	export async function remove(app: GitHubApp, requestingUser: User): Promise<void> {
		if (!requestingUser.ownsAppIds.includes(app.id)) {
			throw new Error(`User ${requestingUser} does not own app ${app.config.name}, and so cannot delete it.`);
		}

		Log.info(`Delete app ${app.config.name}`);

		cache.delete(app.id);

		await SecretUtil.deleteSecret(
			SecretUtil.getSAClient(),
			SecretUtil.getStorageSecretsNamespace(),
			getAppSecretName(app.id),
		);

		await requestingUser.onAppDeleted(app.id);
		// delete all installations, somehow
	}

	function getAppSecretName(appId: number) {
		return `github-app-${appId}`;
	}
}

export default GitHubAppSerializer;
