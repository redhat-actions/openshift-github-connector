import React from "react";
import { Card, CardBody, Spinner } from "@patternfly/react-core";
import UrlPath from "../../common/types/url-path";
import { fetchJSON } from "../util/client-util";

interface BaseDataFetcherProps<Data> {
  /**
   * Return the content to render after fetching completes successfully.
   */
  children: (data: Data, reload: () => Promise<void>) => React.ReactNode,
  /**
   * Any additional actions to take after an error, in addition to displaying the error.
   * If the request failed with an HTTP error, err will have the status code in its 'status' key.
   */
  onError?: (err: Record<string, unknown>) => void,
  type: "generic" | "api",
  loadingDisplay?: "text" | "spinner" | "card" | "card-body" | "none" | JSX.Element,
  // loadingStyle?: React.CSSProperties,
}

interface GenericDataFetcherProps<Data> extends BaseDataFetcherProps<Data> {
  type: "generic",
  fetchData: (abortSignal: AbortSignal) => Promise<Data>,
}

interface ApiDataFetcherProps<Data> extends BaseDataFetcherProps<Data> {
  type: "api",
  endpoint: UrlPath,
}

export type DataFetcherProps<Data> = GenericDataFetcherProps<Data> | ApiDataFetcherProps<Data>;

interface DataFetcherState<Data> {
  data: Data | undefined,
  loaded: boolean,
  loadingError: Error | undefined,
}

// Heavily inspired by https://github.com/argoproj/argo-ui/blob/master/src/components/data-loader.tsx
// Usage: https://github.com/argoproj/argo-ui/blob/master/stories/data-loader.tsx

/**
 * Utility component which can load data asynchronously and then pass the data to children.
 */
export default class DataFetcher<Data> extends React.Component<DataFetcherProps<Data>, DataFetcherState<Data>> {

  private readonly abortController = new AbortController();

  constructor(
    props: DataFetcherProps<Data>,
  ) {
    super(props);
    this.state = { data: undefined, loadingError: undefined, loaded: false };
  }

  static getDerivedStateFromError(error: any) {
    return { loadingError: error };
  }

  override async componentDidMount(): Promise<void> {
    await this.load();
  }

  override async componentWillUnmount(): Promise<void> {
    this.abortController.abort();
  }

  async load(): Promise<void> {
    this.setState({
      data: undefined,
      loadingError: undefined,
      loaded: false,
    });

    try {
      let data: Data;
      if (this.props.type === "api") {
        data = await fetchJSON<never, Data>("GET", this.props.endpoint.path, undefined, {
          signal: this.abortController.signal,
        });
      }
      else {
        data = await this.props.fetchData(this.abortController.signal);
      }

      this.setState({
        data,
        loadingError: undefined,
      });
    }
    catch (err) {
      if (this.abortController.signal.aborted) {
        return;
      }

      console.warn(`Error loading data:`, err);
      if (this.props.onError) {
        this.props.onError(err);
      }
      this.setState({ loadingError: err });
    }
    finally {
      // If you receive an error on this line "Objects are not valid as a React child"
      // It is not a problem with the DataFetcher - somewhere in a DataFetcher's child you have put an object in JSX that should be a string
      // The browser console will contain a trace of the error element
      this.setState({ loaded: true });
    }
  }

  override render() {
    const spinnerSize = "lg";
    const cardSpinnerSize = "md";

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.state == null || !this.state.loaded) {
      const loadingDisplayType = this.props.loadingDisplay ?? "text";
      if (loadingDisplayType === "text") {
        return (
          <span>Loading...</span>
        );
      }
      else if (loadingDisplayType === "spinner") {
        return (
          <div className="center-x">
            <Spinner size={spinnerSize} />
          </div>
        );
      }
      else if (loadingDisplayType === "card") {
        return (
          <Card style={{ minHeight: "100px" }}>
            <CardBody className="centers">
              <Spinner size={cardSpinnerSize}/>
            </CardBody>
          </Card>
        );
      }
      else if (loadingDisplayType === "card-body") {
        return (
          <CardBody className="centers">
            <Spinner size={cardSpinnerSize} />
          </CardBody>
        );
      }
      else if (loadingDisplayType === "none") {
        return (<></>);
      }
      return loadingDisplayType;
    }
    else if (this.state.loadingError) {
      return (
        <p className="text-danger">
          {this.state.loadingError.message}
        </p>
      );
    }
    else if (this.state.data == null) {
      return (
        <p className="text-danger">
          Failed to fetch: Response body empty.
        </p>
      );
    }
    return this.props.children(this.state.data, async () => {
      console.log("DataFetcher reload");
      await this.load();
    });
  }
}
