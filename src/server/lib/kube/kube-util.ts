import * as k8s from "@kubernetes/client-node";

import Log from "server/logger";
import SecretUtil from "server/lib/kube/secret-util";

namespace KubeUtil {
	export async function doesServiceAccountExist(client: k8s.CoreV1Api, namespace: string, serviceAccountName: string): Promise<boolean> {
		Log.info(`Checking if service account ${serviceAccountName} exists in ${namespace}`);
		const serviceAccountsRes = await client.listNamespacedServiceAccount(namespace);
		const serviceAccounts = serviceAccountsRes.body.items;

		const serviceAccountNames = serviceAccounts.map((sa) => sa.metadata?.name).filter((saName): saName is string => saName != null);
		Log.debug(`service accounts: ${serviceAccountNames.join(", ")}`);

		const exists = serviceAccountNames.includes(serviceAccountName);
		Log.info(`service account exists ? ${exists}`);

		return exists;
	}

	export async function createServiceAccount(
		kubeConfig: k8s.KubeConfig,
		createdBy: string,
		namespace: string,
		serviceAccount: string,
		serviceAccountClusterRole?: string
	) {
		Log.info(`Creating ${namespace}/serviceaccount/${serviceAccount}`);

		const coreClient = kubeConfig.makeApiClient(k8s.CoreV1Api);

		await coreClient.createNamespacedServiceAccount(namespace, {
			metadata: {
				name: serviceAccount,
				labels: {
					[SecretUtil.CONNECTOR_LABEL_NAMESPACE + "/created-by"]: createdBy,
				},
			},
		});

		if (serviceAccountClusterRole) {
			const rolebinding: k8s.V1RoleBinding = {
				metadata: {
					generateName: serviceAccount + "-",
				},
				subjects: [{
					kind: "ServiceAccount",
					name: serviceAccount,
					namespace,
				}],
				roleRef: {
					apiGroup: "rbac.authorization.k8s.io",
					name: serviceAccountClusterRole,
					kind: "ClusterRole",
				},
			};

			Log.info(`Adding ${rolebinding.roleRef.kind}/${rolebinding.roleRef.name} to ${serviceAccount}`);

			const authClient = kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api);

			await authClient.createNamespacedRoleBinding(namespace, rolebinding);

			Log.info(`Successfully added ${rolebinding.roleRef.kind}/${rolebinding.roleRef.name} to ${serviceAccount}`);
		}
	}
}

export default KubeUtil;
