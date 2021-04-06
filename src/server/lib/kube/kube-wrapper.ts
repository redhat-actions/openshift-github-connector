import * as k8s from "@kubernetes/client-node";
import ApiResponses from "../../../common/api-responses";
import Log from "../../logger";

/**
 * Transform an HTTP error eg. from the K8s library into something readable.
 */
 export function getFriendlyHTTPError(err: { message: string, response?: any }): string {
  if (!err.response) {
    return JSON.stringify(err);
  }

  const errRes = err.response;
  return `${errRes.request.method} ${errRes.request.uri.href}: `
        + `${errRes.statusCode} ${errRes.body.message || errRes.body.reason}`;
}

export default class KubeWrapper {
	private static _instance: KubeWrapper | undefined;
	private static _initError: Error | undefined;

	constructor(
		private readonly config: k8s.KubeConfig,
		public readonly namespace: string,
		public readonly isInCluster: boolean,
	) {
		// Log.info(`Created KubeWrapper for ${config.currentContext}`);
		Log.info(`Created KubeWrapper`);
	}

	public static get instance(): KubeWrapper {
		if (this._instance == null) {
			throw new Error(`KubeWrapper requested before initialized`);
		} else if (this.initError) {
			throw this.initError;
		}
		return this._instance;
	}

	public static isInitialized(): boolean {
		return this._instance != null || this._initError != null;
	}

	public static get initError(): Error | undefined {
		return this._initError;
	}

	public static get initErrorFriendly(): string | undefined {
		if (!this._initError) {
			return undefined;
		}
		return getFriendlyHTTPError(this._initError);
	}

	public static async initialize(): Promise <KubeWrapper> {
		Log.info(`Configuring kube client...`);

		const tmpConfig = new k8s.KubeConfig();

		let isInCluster = false;
		try {
			tmpConfig.loadFromCluster();
			await KubeWrapper.testConfig(tmpConfig);
			Log.info(`Loaded k8s config from cluster`);
			isInCluster = true;
		} catch (err) {
			// when running in openshift this should be a real error
			// Log.warn(`Failed to load config in-cluster`, err);
			Log.warn(`Failed to load config in-cluster`, err);
			this._initError = err;

			try {
				tmpConfig.loadFromDefault();
				await KubeWrapper.testConfig(tmpConfig);
				Log.info(`Loaded k8s config from default`);
			} catch (err2) {
				Log.warn(`Failed to load default kubeconfig`, err2);
				this._initError = err2;
				throw err2;
			}
		}

		const currentContextName = tmpConfig.getCurrentContext();
		Log.info(`Current context is ${currentContextName}`);
		const currentContext = tmpConfig.getContextObject(currentContextName);
		const currentNamespace = currentContext?.namespace;
		Log.info(`Current namespace is ${currentNamespace}`);

		if (!currentNamespace) {
			const nsErr = new Error(
				`Current context is not namespaced. ` +
				`Run 'kubectl config set-context $(kubectl config current-context) --namespace="$namespace"'`
			);

			this._initError = nsErr;
			throw nsErr;
		}

		this._instance = new KubeWrapper(tmpConfig, currentNamespace, isInCluster);
		this._initError = undefined;

		return this._instance;
	}

	private static async testConfig(tmpConfig: k8s.KubeConfig): Promise <void> {
		const tmpClient = tmpConfig.makeApiClient(k8s.CoreV1Api);
		await tmpClient.getAPIResources();
	}

	public getClusterConfig(): ApiResponses.ClusterConfig {
		const cluster = this.config.getCurrentCluster();
		if (!cluster) {
			throw new Error(`Failed to get cluster info, current cluster is undefined`);
		}

		const user = this.config.getCurrentUser();
		if (!user) {
			throw new Error(`Failed to get current user, current user is undefined`);
		}

		return {
			name: cluster.name,
			server: cluster.server,
			user: user.name,
		};
	}

	public get ns() {
		return this.namespace;
	}

	public get client() {
		if (KubeWrapper.initError) {
			throw new Error(KubeWrapper.initErrorFriendly);
		}
		return this.config.makeApiClient(k8s.CoreV1Api);
	}

	public async verifyServiceAccount(serviceAccountName: string): Promise<boolean> {
		const serviceAccountsRes = await this.client.listNamespacedServiceAccount(this.namespace);
		const serviceAccounts = serviceAccountsRes.body.items;

		const serviceAccountNames = serviceAccounts.map((sa) => sa.metadata?.name).filter((saName): saName is string => saName != null);
		Log.debug(`service accounts: ${serviceAccountNames.join(", ")}`)
		return serviceAccountNames.includes(serviceAccountName);
	}
}
