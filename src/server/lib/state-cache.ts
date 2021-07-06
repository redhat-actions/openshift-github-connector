import Log from "server/logger";

export default class StateCache {
// const INSTALL_TIME_LIMIT_MS = 15 * 60 * 1000;

  private readonly states = new Map<string, { iat: number, state: string }>();

  private static readonly TTL_MS = 5 * 60 * 1000;

  public add(uid: string, state: string): void {
    Log.debug(`Saving state ${state} for uid ${uid}`);
    this.states.set(uid, { iat: Date.now(), state });
  }

  public validate(uid: string, state: string): boolean {
    const stateLookup = this.states.get(uid);
    if (stateLookup == null) {
      Log.info(`State "${state}" not found in state map`);
      return false;
    }

    this.states.delete(uid);

    if (StateCache.isExpired(stateLookup.iat, StateCache.TTL_MS)) {
      Log.info(`State "${state}" is expired`);
      return false;
    }

    return true;
  }

  private static isExpired(iat: number, limitMs: number): boolean {
    return (Date.now() - iat) > limitMs;
  }
}
