namespace ApiRequests {
  export interface InitCreateApp {
    state: string;
  }

  export interface CreatingApp {
    code: string;
    state: string;
  }

  export interface SetServiceAccount {
    // serviceAccountSecret: k8s.V1Secret & { data: ServiceAccountSecretData };
    serviceAccountToken: string;
  }

  export interface PostInstall {
    // appId: string;
    // ownerId: string;
    installationId: string;
    oauthCode: string;
  }

  /*
  export function checkMissingKeys<
    ReqBody extends Record<string, unknown>, Keys extends Array<keyof ReqBody>
  >(reqBody: ReqBody, keys: Keys): { [key: Keys]: unknown } {

    const missingKeys: Keys = new Array<Keys>();

    keys.forEach((key) => {
      if (reqBody[key] == null) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length === 0) {
      return reqBody;
    }
    else if (missingKeys.length === 1) {
      throw new Error(`Request body missing required key "${missingKeys[0]}"`);
    }
    else {
      throw new Error(`Request body missing required keys "${missingKeys.map((key) => `"${key}"`).join(", ")}`);
    }
  }
  */
}

export default ApiRequests;
