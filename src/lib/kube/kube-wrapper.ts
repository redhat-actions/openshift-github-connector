import * as k8s from "@kubernetes/client-node";
import Log from "../logger";

export type KubeHttpError = Error & { response: any };

export default class KubeWrapper {
    private static _instance: KubeWrapper | undefined;
    private static _initError: KubeHttpError | undefined;

    constructor(
        private readonly config: k8s.KubeConfig
    ) {

    }

    public static get instance(): KubeWrapper {
        if (this._instance == null) {
            throw new Error(`KubeWrapper requested before initialized`);
        }
        return this._instance;
    }

    public static get initError(): KubeHttpError | undefined {
        return this._initError;
    }

    public static isInitialized(): boolean {
        return KubeWrapper._instance != null;
    }

    public static async initialize(): Promise<KubeWrapper> {
        Log.info(`Configuring kube client...`);

        const tmpConfig = new k8s.KubeConfig();

        // let isInCluster = false;
        try {
            tmpConfig.loadFromCluster();
            await KubeWrapper.testConfig(tmpConfig);
            Log.info(`Loaded k8s config from cluster`);
            // isInCluster = true;
        }
        catch (err) {
            // when running in openshift this should be a real error
            // Log.warn(`Failed to load config in-cluster`, err);
            Log.warn(`Failed to load config in-cluster`);
            this._initError = err;

            try {
                tmpConfig.loadFromDefault();
                await KubeWrapper.testConfig(tmpConfig);
                Log.info(`Loaded k8s config from default`);
                this._initError = undefined;
            }
            catch (err2) {
                Log.error(`Failed to load default kubeconfig`, err);
                this._initError = err2;
                throw err2;
            }
        }

        this._instance = new KubeWrapper(tmpConfig);

        const currentNS = this._instance.getCurrentNamespace();
        if (currentNS) {
            Log.info(`Current namespace is ${currentNS}`);
        }

        return this._instance;
    }

    private static async testConfig(tmpConfig: k8s.KubeConfig): Promise<void> {
        const tmpClient = tmpConfig.makeApiClient(k8s.CoreV1Api);
        await tmpClient.getAPIResources();
    }

    public getCurrentNamespace(): string | undefined {
        const currentContext = this.config.getCurrentContext();
        return this.config.getContextObject(currentContext)?.namespace;
    }

    public getClusterInfo(): { name: string, user: string, server: string } {
        const cluster = this.config.getCurrentCluster();
        if (!cluster) {
            throw new Error(`Failed to get cluster info, current cluster is undefined`);
        }

        const user = this.config.getCurrentUser();
        if (!user) {
            throw new Error(`Failed to get current user, current user is udnefined`);
        }

        return {
            name: cluster.name,
            server: cluster.server,
            user: user.name,
        };
    }

    public async getPods(namespace?: string): Promise<k8s.V1PodList | undefined> {
        const client = this.config.makeApiClient(k8s.CoreV1Api);
        let pods;
        if (namespace) {
            pods = await client.listNamespacedPod(namespace);
        }
        else {
            const currentNS = this.getCurrentNamespace();
            if (currentNS) {
                pods = await client.listNamespacedPod(currentNS);
            }
            else {
                Log.error("Failed to get pods; no namespace given or set in config");
                return undefined;
            }
        }
        return pods.body;
    }
}
