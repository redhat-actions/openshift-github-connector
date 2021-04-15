import * as k8s from "@kubernetes/client-node";
import jwt from "jsonwebtoken";

import ApiResponses from "../../../common/api-responses";
import Log from "../../logger";
import { checkKeys, getFriendlyHTTPError } from "../../util/server-util";

type RawServiceAccountToken = {
	iss: string;
	"kubernetes.io/serviceaccount/namespace": string;
	"kubernetes.io/serviceaccount/secret.name": string;
	"kubernetes.io/serviceaccount/service-account.name": string;
	"kubernetes.io/serviceaccount/service-account.uid": string;
	sub: string;
}

export type ServiceAccountToken = {
	token: string;
	namespace: string;
	secretName: string;
	serviceAccountName: string;
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
		if (this.initError) {
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

	private static decodeServiceAccountToken(serviceAccountToken: string): ServiceAccountToken {

		/*
		const invalidMsg = `Invalid service account secret`;

		let serviceAccountSecret;
    try {
      serviceAccountSecret = JSON.parse(serviceAccountToken);
    }
    catch (err) {
			// err.message will be "Unexpected token <token> in JSON at position <position>"
			throw new Error(`${invalidMsg}: ${err.message}`);
    }

		serviceAccountSecret = objValuesFromb64(serviceAccountSecret);

    const checkMetadata = checkKeys(serviceAccountSecret, "metadata");
    if (!checkMetadata) {
      throw new Error(`${invalidMsg}: Missing "metadata" key`);
    }
		const annotations = checkKeys(checkMetadata.metadata, "annotations");
		if (!annotations) {
			throw new Error(`${invalidMsg}: Missing "metadata.annotations" key`);
		}

		const SA_NAME_ANNOTATION = "kubernetes.io/service-account.name";

		const saNameAnnotation = checkKeys(annotations.annotations, SA_NAME_ANNOTATION);
		if (!saNameAnnotation) {
			throw new Error(`${invalidMsg}: Missing "metadata.annotations.${SA_NAME_ANNOTATION}" key`);
		}
		const saName = saNameAnnotation[SA_NAME_ANNOTATION];

    const checkData = checkKeys(serviceAccountSecret, "data");
    if (!checkData) {
      throw new Error(`${invalidMsg}: Missing "data" key`);
    }

    const { data } = checkData.data;
    const token = checkKeys(data, "token");
    if (!token) {
      throw new Error(`${invalidMsg}: Missing "data.token" key`);
    }*/

		// what keys are used to sign the SA token?
		const decodedTokenUntested = jwt.decode(serviceAccountToken);
		if (decodedTokenUntested == null) {
			throw new Error(`Failed to decode service account token: returned null.`);
		}
		else if (typeof decodedTokenUntested === "string") {
			throw new Error(`Failed to decode service account token: returned plain string.`);
		}

		const checkKeysResult = checkKeys<RawServiceAccountToken>(decodedTokenUntested,
			"iss",
			"kubernetes.io/serviceaccount/namespace",
			"kubernetes.io/serviceaccount/secret.name",
			"kubernetes.io/serviceaccount/service-account.name",
			"kubernetes.io/serviceaccount/service-account.uid",
			"sub"
		);

		if (!checkKeysResult) {
			throw new Error(`Failed to decode service account token: Missing expected field`);
		}

		const decodedToken = decodedTokenUntested as RawServiceAccountToken;

		Log.info(
			`Successfully decoded Service Account token for Service Account `
			+ decodedToken["kubernetes.io/serviceaccount/service-account.name"]
		)

		return {
			namespace: decodedToken["kubernetes.io/serviceaccount/namespace"],
			secretName: decodedToken["kubernetes.io/serviceaccount/secret.name"],
			serviceAccountName: decodedToken["kubernetes.io/serviceaccount/service-account.name"],
			token: serviceAccountToken,
		};
	}

	public static async loadForServiceAccount(serviceAccountTokenSecretStr: string): Promise<ServiceAccountToken> {
		Log.info(`Creating kube context from service account token`);
		// will throw if invalid
		const decodedToken = this.decodeServiceAccountToken(serviceAccountTokenSecretStr);

		const clusterConfig = new k8s.KubeConfig()
		clusterConfig.loadFromCluster();
		const cluster = clusterConfig.clusters[0];

		const config = new k8s.KubeConfig();

		Log.info(`Creating kube config for service account ${decodedToken.serviceAccountName}`);

		config.loadFromClusterAndUser(cluster, {
			name: decodedToken.serviceAccountName,
			token: decodedToken.token,
		});

		this.testConfig(config);

		const context = config.getContextObject(config.getCurrentContext());
		if (context == null) {
			throw new Error(`Service Account config had no current context after set up`);
		}
		Log.info(`Successfully created kube config with service account token`);

		return decodedToken;
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
			err = getFriendlyHTTPError(err);
			// when running in openshift this should be a real error
			// Log.warn(`Failed to load config in-cluster`, err);
			Log.warn(`Failed to load config in-cluster`, err);
			this._initError = err;

			try {
				tmpConfig.loadFromDefault();
				await KubeWrapper.testConfig(tmpConfig);
				Log.info(`Loaded k8s config from default`);
			} catch (err2) {
				err2 = getFriendlyHTTPError(err2);
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

		KubeWrapper

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
			name: cluster.name,
			server: cluster.server,
			user: {
				name: user.name
			},
		};
	}

	public get ns() {
		return this.namespace;
	}

	public get coreClient() {
		return this.config.makeApiClient(k8s.CoreV1Api);
	}

	/*
	public async doesServiceAccountExist(serviceAccountName: string): Promise<boolean> {
		const serviceAccountsRes = await this.coreClient.listNamespacedServiceAccount(this.namespace);
		const serviceAccounts = serviceAccountsRes.body.items;

		Log.debug(`Checking if ${serviceAccountName} exists`);
		const serviceAccountNames = serviceAccounts.map((sa) => sa.metadata?.name).filter((saName): saName is string => saName != null);
		Log.debug(`service accounts: ${serviceAccountNames.join(", ")}`);

		const exists = serviceAccountNames.includes(serviceAccountName);
		Log.debug(`service account exists ? ${exists}`);

		return exists;
	}
	*/
}
