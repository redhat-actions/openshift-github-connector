import KubeWrapper from "./lib/kube/kube-wrapper";
import Log from "./logger";

async function loadKube(): Promise<void> {
  try {
    await KubeWrapper.initialize();
  }
  catch (err) {
    Log.error(`Failed to initialize KubeWrapper`, err);
  }
}

export async function startup(): Promise<void> {
  await loadKube();

  await Promise.all([
  ]);
}
