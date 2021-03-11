import * as k8s from "@kubernetes/client-node";

export default class KubeWrapper {
    private static _instance: KubeWrapper | undefined;

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

    public static isInitialized(): boolean {
        return KubeWrapper._instance != null;
    }

    public static async initialize(): Promise<KubeWrapper> {
        console.log(`Configuring kube client...`);

        const tmpConfig = new k8s.KubeConfig();

        let isInCluster = false;
        try {
            tmpConfig.loadFromCluster();
            await KubeWrapper.testConfig(tmpConfig);
            console.log(`Loaded k8s config from cluster`);
            isInCluster = true;
        }
        catch (err) {
            // when running in openshift this should be a real error
            // console.warn(`Failed to load config in-cluster`, err);
            console.warn(`Failed to load config in-cluster`);

            try {
                tmpConfig.loadFromDefault();
                await KubeWrapper.testConfig(tmpConfig);
                console.log(`Loaded k8s config from default`);
            }
            catch (err2) {
                console.error(`Failed to load default kubeconfig`, err);
                throw err2;
            }
        }

        this._instance = new KubeWrapper(tmpConfig, isInCluster);

        const currentNS = this._instance.getCurrentNamespace();
        if (currentNS) {
            console.log(`Current namespace is ${currentNS}`);
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
                console.error("Failed to get pods; no namespace given or set in config");
                return undefined;
            }
        }
        return pods.body;
    }
}
