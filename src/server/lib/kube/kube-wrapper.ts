import * as k8s from "@kubernetes/client-node";
import fs from "fs/promises";
import { URL } from "url";

import ApiResponses from "common/api-responses";
import KubeUtil from "server/lib/kube/kube-util";
import Log from "server/logger";
import { getFriendlyHTTPError } from "server/util/server-util";

export default class KubeWrapper {
	private static _instance: KubeWrapper | undefined;
	private static _initError: Error | undefined;

	private static readonly SA_ENVVAR = "CONNECTOR_SERVICEACCOUNT_NAME";
	private static readonly APISERVER_ENVVAR = "CLUSTER_API_SERVER";

	/**
	 * @param config When in-cluster, the KubeConfig for the connector's ServiceAccount.
	 * 	In development, this is the authenticated user's KubeConfig.
	 * @param namespace When in-cluster, the namespace the Connector is deployed into.
	 * 	In devlopment, this is the authenticated user's current context's namespace.
	 */
	constructor(
		public readonly config: k8s.KubeConfig,
		public readonly namespace: string,
		public readonly isInCluster: boolean,
		public readonly clusterExternalApiServer: string,
		public readonly serviceAccountName: string,
	) {
		// Log.info(`Created KubeWrapper for ${config.currentContext}`);
		Log.info(`Created KubeWrapper in namespace ${namespace}. isInCluster=${isInCluster} and serviceAccountName=${serviceAccountName}`);
	}

	public static get instance(): KubeWrapper {
		if (this.initError) {
			Log.error(`KubeWrapper instance requested but it has an init error`, this.initError);
			throw this.initError;
		}
		else if (this._instance == null) {
			throw new Error(`KubeWrapper requested before initialized`);
		}
		return this._instance;
	}

	public static isInitialized(): boolean {
		return this._instance != null || this._initError != null;
	}

	public static get initError(): Error | undefined {
		return this._initError;
	}

	public static async initialize(): Promise<KubeWrapper> {
		Log.info(`Configuring kube client`);

		const tmpConfig = new k8s.KubeConfig();

		let isInCluster = false;
		try {
			tmpConfig.loadFromCluster();
			await KubeWrapper.testConfig(tmpConfig);
			Log.info(`Loaded k8s config from cluster`);
			isInCluster = true;
		}
		catch (err) {
			err = getFriendlyHTTPError(err);
			// when running in openshift this should be a real error
			// Log.warn(`Failed to load config in-cluster`, err);
			Log.warn(`Failed to load config in-cluster`, err);
			this._initError = err;

			try {
				tmpConfig.loadFromDefault();
				await KubeWrapper.testConfig(tmpConfig);
				Log.info(`Loaded k8s config from default`);
			}
			catch (err2) {
				err2 = getFriendlyHTTPError(err2);
				Log.warn(`Failed to load default kubeconfig`, err2);
				this._initError = err2;
				throw err2;
			}
		}

		const currentContextName = tmpConfig.getCurrentContext();
		Log.info(`Current context is ${currentContextName}`);
		const currentContext = tmpConfig.getContextObject(currentContextName);

		let currentNamespace = currentContext?.namespace;
		if (!currentNamespace && isInCluster) {
			Log.info("Load namespace from pod mount file");
			currentNamespace = (await fs.readFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace")).toString().trim();
		}
		Log.info(`Current namespace is ${currentNamespace}`);

		if (!currentNamespace) {
			const nsErr = new Error(
				`Current context is not namespaced. ` +
				`Run 'kubectl config set-context $(kubectl config current-context) --namespace="$namespace"'`
			);

			this._initError = nsErr;
			throw nsErr;
		}

		const serviceAccountName = process.env[KubeWrapper.SA_ENVVAR];
		if (!serviceAccountName) {
			const saError = new Error(`No service account name provided in environment: ${KubeWrapper.SA_ENVVAR} is not set.`);
			this._initError = saError;
			throw saError;
		}

		Log.info(`Service account name is ${serviceAccountName}`);

		const saExists = await KubeUtil.doesServiceAccountExist(
			tmpConfig.makeApiClient(k8s.CoreV1Api), currentNamespace, serviceAccountName
		);

		if (!saExists) {
			const saNotExistError = new Error(
				`Service account "${serviceAccountName}" `
				+ `provided in environment variable "${KubeWrapper.SA_ENVVAR}" does not exist in namespace ${currentNamespace}`
			);
			this._initError = saNotExistError;
			throw saNotExistError;
		}

		let clusterExternalApiServerOriginal = process.env[KubeWrapper.APISERVER_ENVVAR];
		if (!clusterExternalApiServerOriginal && !isInCluster) {
			clusterExternalApiServerOriginal = tmpConfig.getCurrentCluster()?.server;
		}

		if (!clusterExternalApiServerOriginal) {
			const apiServerUrlErr = new Error(`Cluster external API server not provided in environment: ${KubeWrapper.APISERVER_ENVVAR} is not set`);
			this._initError = apiServerUrlErr;
			throw apiServerUrlErr;
		}


		const asUrl = new URL(clusterExternalApiServerOriginal);
		let clusterExternalApiServer = clusterExternalApiServerOriginal;
		if (!asUrl.protocol) {
			clusterExternalApiServer = "https://" + clusterExternalApiServerOriginal;
		}

		Log.info(`${KubeWrapper.APISERVER_ENVVAR} is ${clusterExternalApiServerOriginal}, processed to ${clusterExternalApiServer}`);

		this._instance = new KubeWrapper(tmpConfig, currentNamespace, isInCluster, clusterExternalApiServer, serviceAccountName);
		this._initError = undefined;

		return this._instance;
	}

	private static async testConfig(tmpConfig: k8s.KubeConfig): Promise<void> {
		Log.info(`Testing kubeconfig for server ${tmpConfig.clusters[0].name}`)
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
			externalServer: this.clusterExternalApiServer,
			name: cluster.name,
			user: {
				name: user.name,
			},
			server: cluster.server,
		};
	}

	/**
	 * @returns The cluster the Connector is deployed into.
	 */
	public get cluster(): k8s.Cluster {
		const cluster = this.config.getCluster(this.config.clusters[0].name);
		if (!cluster) {
			throw new Error(`KubeWrapper config has no cluster!`);
		}
		return cluster;
	}
}
