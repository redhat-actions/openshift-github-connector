import k8s from "@kubernetes/client-node";
import { v4 as uuid } from "uuid";

import { OpenShiftUserInfo } from "common/types/user-types";
import Log from "server/logger";
import { fetchFromOpenShiftApiServer } from "server/util/server-util";
import { OpenShiftUserCR, OpenShiftOAuthCR } from "./server-user-types";

namespace TokenUtil {

	export interface TokenInfo {
		accessToken: string;
		createdAtEstimate: number;
		expiresAtEstimate: number;
	}

	export async function introspectUser(accessToken: string): Promise<OpenShiftUserInfo> {
		const authorization = `Bearer ${accessToken}`;

		// https://access.redhat.com/discussions/4448681
		const USER_INTROSPECTION_PATH = "apis/user.openshift.io/v1/users/~";

		const userDataResponse = await fetchFromOpenShiftApiServer(USER_INTROSPECTION_PATH, authorization) as OpenShiftUserCR;

		Log.info(`User UID is ${userDataResponse.metadata?.uid} and name is ${userDataResponse.metadata?.name}`);

		let uid = userDataResponse.metadata?.uid;
		// uid can be undefined - seemingly only for the special kubeadmin user
		if (uid == null) {
			// the 0s are appended to make sure it does not collide with another user's uid,
			// though it is no longer a valid uuid that does not matter we just treat it as a string.
			uid = uuid() + "-0000";
			Log.warn(`User ${userDataResponse.metadata?.name} does not have a UID; assigned UID ${uid}`);
		}

		const name = userDataResponse.metadata?.name ?? uid;

		const userData = { uid, name };

		/*
		// https://docs.openshift.com/container-platform/4.7/authentication/managing-oauth-access-tokens.html#oauth-view-details-tokens_managing-oauth-access-tokens
		const tokenData = await fetchFromOpenShiftApiServer(`apis/oauth.openshift.io/v1/useroauthaccesstokens/${accessToken}`, {
			headers: {
				...AuthorizationHeader,
				[HttpConstants.Headers.Accept]: HttpConstants.ContentTypes.Json,
			},
			bo
		}
		*/

		const ssar: k8s.V1SelfSubjectAccessReview = {
			apiVersion: "authorization.k8s.io/v1",
			kind: "SelfSubjectAccessReview",
			spec: {
				resourceAttributes: {
					group: "*",
					namespace: "github-connector",    // TODO !!
					resource: "*",
					verb: "*",
				},
			},
		};

		const adminSSARResponse = await fetchFromOpenShiftApiServer(
			"apis/authorization.k8s.io/v1/selfsubjectaccessreviews",
			authorization, {
				method: "POST",
				body: JSON.stringify(ssar),
		}) as k8s.V1SelfSubjectAccessReview;

		Log.info(`SSAR status for ${userData.name}: ${JSON.stringify(adminSSARResponse.status)}`);

		const isAdmin = adminSSARResponse.status?.allowed ?? false;

		return {
			...userData,
			isAdmin,
		};
	}

	export async function introspectToken(token: { accessToken: string, createdAtEstimate: number }): Promise<TokenInfo> {
		const authorization = `Bearer ${token.accessToken}`;

		let tokenMaxAgeS;
		try {
			const clusterOauthConfiguration = await fetchFromOpenShiftApiServer(
				"apis/config.openshift.io/v1/oauths/cluster",
				authorization
			);

			const clusterOAuth = await clusterOauthConfiguration as OpenShiftOAuthCR;

			tokenMaxAgeS = clusterOAuth.spec.tokenConfig?.accessTokenMaxAgeSeconds;
		}
		catch (err) {
			Log.warn(`Error retrieving token max age:`, err);
		}

		if (tokenMaxAgeS == null || tokenMaxAgeS === 0) {
			// if the max age is 0 or not found, the default is used, which is one day
			// https://docs.openshift.com/container-platform/4.1/authentication/configuring-internal-oauth.html
			tokenMaxAgeS = 86400;
			Log.info(`Using default token max age ${tokenMaxAgeS}s`)
		}
		else {
			Log.info(`Token max age is ${tokenMaxAgeS}s`)
		}

		return {
			...token,
			expiresAtEstimate: token.createdAtEstimate + tokenMaxAgeS * 1000
		};
	}
}

export default TokenUtil;
