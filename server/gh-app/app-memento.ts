import os from "os";
import path from "path";
import fs from "fs/promises";
import GitHubApp from "./app";
import GitHubAppConfig from "./app-config";

type GitHubAppMemento = GitHubAppConfig & { installationID: number };

const CONFIG_SAVE_PATH = path.join(os.tmpdir(), "github-app-config.json");

namespace GitHubAppMemento {
    // at least for dev purposes, we have to save the app configuration to disk
    // so we don't have to recreate the app every time the webapp restarts
    export async function save(instance: GitHubApp): Promise<void> {
        console.log(`Save app config to ${CONFIG_SAVE_PATH}`);

        const memento: GitHubAppMemento = {
            ...instance.config,
            installationID: instance.installationID,
        };

        const mementoStr = JSON.stringify(memento, undefined, 4);
        await fs.writeFile(CONFIG_SAVE_PATH, mementoStr);
    }

    export async function tryLoad(): Promise<GitHubApp | undefined> {
        console.log(`Try to load app config from ${CONFIG_SAVE_PATH}`);

        let mementoStr;
        try {
            mementoStr = (await fs.readFile(CONFIG_SAVE_PATH)).toString();
        }
        catch (err) {
            if (err.code === "ENOENT") {
                return undefined;
            }
            throw err;
        }

        const memento: GitHubAppMemento = JSON.parse(mementoStr);
        return GitHubApp.create(memento, memento.installationID);
    }
}

export default GitHubAppMemento;
