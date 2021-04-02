import ApiResponses from "../../common/api-responses";
import HttpConstants from "../../common/http-constants";

export function isJsonContentType(res: Response): boolean {
  const contentType = res.headers.get(HttpConstants.Headers.ContentType);

  return !!contentType
    && (
      contentType.startsWith(HttpConstants.ContentTypes.Json)
      || contentType.startsWith(HttpConstants.ContentTypes.Problem)
    );
}

export async function getHttpError(res: Response): Promise<string> {
  let message: string;
  let statusMessage: string | undefined;
  if (isJsonContentType(res)) {
    const resBody = await res.json();
    if (resBody.detail) {
      const errorBody = resBody as ApiResponses.Error;
      message = `${errorBody.title}: ${errorBody.detail}`;
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

  return `${res.url} responded ${res.status}${statusMessage ? " " + statusMessage : ""}: ${message}`;
}

export async function throwIfError(res: Response): Promise<void> {
  if (res.status > 399) {
    const errMsg = await getHttpError(res);
    throw new Error(errMsg);
  }
}

type Methods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function fetchJSON<T = void>(
  method: Methods, url: string, options: RequestInit = {}
): Promise<T> {

  let headers: HeadersInit = {};

  const acceptTypes = [
    HttpConstants.ContentTypes.Json, HttpConstants.ContentTypes.Problem,
  ].join(",");

  headers = {
    [HttpConstants.Headers.Accept]: acceptTypes,
    [HttpConstants.Headers.ContentType]: options.body != null ? HttpConstants.ContentTypes.Json : "",
    ...options.headers,
  };

  const res = await fetch(url, {
    method,
    headers,
    ...options,
  });

  await throwIfError(res);

  if (!isJsonContentType(res)) {
    throw new Error(`Received unexpected non-JSON Content-Type from "${url}": `
      + `${res.headers.get(HttpConstants.Headers.ContentType)}`);
  }

  return (await res.json()) as T;
}
