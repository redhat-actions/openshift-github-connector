import User from "./user";
import { UserMemento, UserMementoSaveable, UserSessionData } from "./server-user-types";
import Log from "server/logger";
import SecretUtil from "../kube/secret-util";

const userCache = new Map<string, User>();

export const saveUser = async (user: User): Promise<void> => {
	Log.info(`Saving user ${user.name}`);

	const memento: UserMementoSaveable = {
		uid: user.uid,
		imageRegistries: user.imageRegistries.toString(),
	};

	if (user.githubUserInfo) {
		memento.githubUserId = user.githubUserInfo.id.toString();

		if (user.installation) {
			memento.installedAppId = user.installation.app.config.id.toString();
			memento.installationId = user.installation.installationId.toString();
		}
	}

	await SecretUtil.createSecret(getUserSecretName(user.uid), memento, { subtype: SecretUtil.Subtype.USER });
	Log.info(`Update user ${user.name} data in cache`);
	userCache.set(user.uid, user);
}

async function loadMemento(
	uid: string,
): Promise<UserMemento | undefined> {

	const secret = await SecretUtil.loadFromSecret<UserMementoSaveable>(getUserSecretName(uid));
	if (!secret) {
		return undefined;
	}

	const result: UserMemento = {
		...secret.data,
		uid: secret.data.uid,
	};

	if (secret.data.installedAppId != null && secret.data.installationId != null) {
		result.installationInfo = {
			appId: Number(secret.data.installedAppId),
			installationId: Number(secret.data.installationId),
		}
	}

	return result;
}

export async function loadUser(userSession: UserSessionData): Promise<User | undefined> {
	const { uid } = userSession.info;

	// TODO expiry ?

	if (userCache.has(uid)) {
		Log.debug(`Loaded user data from cache`);
		return userCache.get(uid);
	}

	const memento = await loadMemento(uid);
	if (!memento) {
		return undefined;
	}

	const user = await User.create(userSession.token, userSession.info, memento.imageRegistries, memento.githubUserInfo, memento.installationInfo);

	Log.info(`Loaded memento with uid ${memento.uid} for user with uid ${uid}`);
	userCache.set(uid, user);
	return user;
}

function getUserSecretName(uid: string) {
	return `connector-user-${uid}`;
}
