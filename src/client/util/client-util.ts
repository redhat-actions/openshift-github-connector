import ApiResponses from "../../common/api-responses";
import { Severity, Stringable } from "../../common/common-util";
import HttpConstants from "../../common/http-constants";

export function isJsonContentType(res: Response): boolean {
  const contentType = res.headers.get(HttpConstants.Headers.ContentType);

  return !!contentType
    && (
      contentType.startsWith(HttpConstants.ContentTypes.Json)
      // || contentType.startsWith(HttpConstants.ContentTypes.Problem)
    );
}

async function getHttpError(res: Response): Promise<Error> {
  let message: string;
  let statusMessage: string | undefined;
  let severity: Severity | undefined;
  if (isJsonContentType(res)) {
    const resBody = await res.json();
    if ((resBody as ApiResponses.ResultFailed).message) {
      const errorBody = resBody as ApiResponses.ResultFailed;
      message = `${errorBody.message}`;
      severity = errorBody.severity;
      statusMessage = errorBody.statusMessage;
    }
    else {
      message = JSON.stringify(resBody);
    }

    if (message.startsWith("Error: ")) {
      message = message.substring("Error: ".length, message.length);
    }
  }
  else {
    message = await res.text();
  }

  const err = new Error(`${res.url} responded ${res.status}${statusMessage ? " " + statusMessage : ""}: ${message}`);
  (err as any).status = res.status;
  if (severity) {
    (err as any).severity = severity;
  }
  return err;
}

export async function throwIfError(res: Response): Promise<void> {
  if (res.status > 399) {
    const err = await getHttpError(res);
    throw err;
  }
}

const CSRF_HEADER = "X-CSRFToken";

// copied from console/frontend/public/co-fetch
const CSRF_COOKIE = "csrf-token=";
function getCSRFToken(): string {
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.startsWith(CSRF_COOKIE))
    .map((c) => c.slice(CSRF_COOKIE.length))
    .pop() ?? "";
}

export async function fetchJSON<
  // eslint-disable-next-line @typescript-eslint/ban-types
  Req extends {} = never,
  Res = void
>(
  method: HttpConstants.Methods, url: Stringable, body?: Req, options: Omit<RequestInit, "body" | "method"> = {}
): Promise<{ status: number } & Res> {

  let stringifiedBody: string | undefined;
  if (body != null) {
    stringifiedBody = JSON.stringify(body);
  }

  const consoleCSRFToken = getCSRFToken();

  const headers = {
    ...options.headers,
    ...HttpConstants.getJSONHeadersForReq(stringifiedBody),
    [CSRF_HEADER]: consoleCSRFToken,
  };

  const res = await fetch(url.toString(), {
    ...options,
    method,
    headers,
    body: stringifiedBody,
  });

  await throwIfError(res);

  if (res.status === 204) {
    const resBody = {} as Res;
    return {
      status: res.status,
      ...resBody,
    };
  }

  if (!isJsonContentType(res)) {
    throw new Error(`Received unexpected non-JSON Content-Type from "${url}": `
      + `${res.headers.get(HttpConstants.Headers.ContentType)}`);
  }

  const resBody = await res.json() as Res;
  return {
    status: res.status,
    ...resBody,
  };
}

export function getWindowLocationNoPath(): string {
  return window.location.protocol + "//" + window.location.host;
}

export function isInOpenShiftConsole(): boolean {
  return process.env.IN_OPENSHIFT_CONSOLE?.toString() === "true";
}

export function getConsoleModifierClass(): string {
  // "console" class is already used by bootstrap so we add 'is'
  return isInOpenShiftConsole() ? "is-console" : "is-standalone";
}

export function tryFocusElement(id: string, severity: Severity | "primary" = "primary"): void {
  const elem = document.getElementById(id);
  if (!elem) {
    return;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
  elem.scrollIntoView({
    behavior: "auto",
    block: "center",
    inline: "center",
  });

  if (elem.style.display === "none") {
    return;
  }

  const classes = [ "border", "border-" + severity ];
  elem.classList.add(...classes);
  setTimeout(() => elem.classList.remove(...classes), 1000);
}
