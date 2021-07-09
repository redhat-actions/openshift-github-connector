export default class UrlPath {

  constructor(
    private readonly parentPath: UrlPath | undefined,
    private readonly endpoint: string,
  ) {
    if (!this.endpoint.startsWith("/")) {
      this.endpoint = "/" + endpoint;
    }
  }

  public get path(): string {
    if (this.parentPath && this.parentPath.path !== "/") {
      return this.parentPath.path + this.endpoint;
    }
    return this.endpoint;
  }

  public toString(): string {
    return this.path;
  }

  public withParam(param: string): UrlPath {
    return new UrlPath(this, param);
  }
}
