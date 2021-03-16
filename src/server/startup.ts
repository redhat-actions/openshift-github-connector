import GitHubAppMemento from "../lib/gh-app/app-memento";
import KubeWrapper from "../lib/kube/kube-wrapper";
import Log from "../lib/logger";
import { getFriendlyHTTPError } from "./util";

async function loadGitHubApp(): Promise<void> {
    try {
        const githubApp = await GitHubAppMemento.tryLoad();
        if (githubApp) {
            Log.info(`Successfully loaded memento for app "${githubApp.config.name}"`);
        }
        else {
            Log.info(`No app memento was loaded.`);
        }
    }
    catch (err) {
        Log.warn(`Failed to load app memento`, err);
    }
}

async function loadKube(): Promise<void> {
    try {
        await KubeWrapper.initialize();
    }
    catch (err) {
        Log.warn(`Failed to initialize KubeWrapper`, getFriendlyHTTPError(err));
    }
}

export async function startup(): Promise<void> {
    await Promise.all([
        loadGitHubApp(),
        loadKube(),
    ]);

    Log.info(`Finished startup`);
}
