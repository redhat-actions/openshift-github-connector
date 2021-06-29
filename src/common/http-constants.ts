namespace HttpConstants {

  export type Methods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  export namespace Headers {
    export const Accept = "Accept";
    export const Allow = "Allow";
    export const ContentType = "Content-Type";
    export const ContentDisposition = "Content-Disposition";
    export const ContentLength = "Content-Length";
    export const CacheControl = "Cache-Control";
  }

  export namespace ContentTypes {
    export const Json = "application/json";
    export const Problem = "application/problem+json";
    export const Html = "text/html";
    export const TextPlain = "text/plain";
    export const OctectStream = "application/octet-stream";
    export const JsonPatch = "application/strategic-merge-patch+json";

    export const Charset = "charset=utf-8";
  }

  export function getJSONHeadersForReq(body?: string): Record<string, string> {
    const acceptTypes = [
      HttpConstants.ContentTypes.Json, HttpConstants.ContentTypes.Problem,
    ].join(",");

    const contentType = body != null && Object.keys(body).length > 0
      ? HttpConstants.ContentTypes.Json + "; " + HttpConstants.ContentTypes.Charset
      : "";

    const headers: Record<string, string> = {};

    headers[HttpConstants.Headers.Accept] = acceptTypes;
    if (body) {
      headers[HttpConstants.Headers.ContentLength] = body.length.toString();
    }
    headers[HttpConstants.Headers.ContentType] = contentType;

    return headers;
  }
}

export default HttpConstants;
