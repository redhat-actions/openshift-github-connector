import React from "react";
import { Spinner } from "react-bootstrap";
import { ApiEndpoint } from "../../common/endpoints";

interface BaseDataFetcherProps<Data> {
    children: (data: Data) => React.ReactNode;
    type: "generic" | "api";
    loadingDisplay?: "text" | "spinner" | "spinner-1em" | "none" | JSX.Element;
    loadingStyle?: React.CSSProperties;
}

interface GenericDataFetcherProps<Data> extends BaseDataFetcherProps<Data> {
    type: "generic";
    fetchData: () => Promise<Data>;
}

interface ApiDataFetcherProps<Data> extends BaseDataFetcherProps<Data> {
    type: "api";
    endpoint: ApiEndpoint;
}

type DataFetcherProps<Data> = GenericDataFetcherProps<Data> | ApiDataFetcherProps<Data>;

interface DataFetcherState<Data> {
    data: Data | undefined;
    loaded: boolean;
    loadingError: Error | undefined;
}

// Heavily inspired by https://github.com/argoproj/argo-ui/blob/master/src/components/data-loader.tsx
// Usage: https://github.com/argoproj/argo-ui/blob/master/stories/data-loader.tsx

/**
 * Utility component which can load data asynchronously and then pass the data to children.
 */
export default class DataFetcher<Data> extends React.Component<DataFetcherProps<Data>, DataFetcherState<Data>> {

  constructor(
    props: DataFetcherProps<Data>,
  ) {
    super(props);
    this.state = { data: undefined, loadingError: undefined, loaded: false };
  }

  async componentDidMount(): Promise<void> {
    try {
      let data: Data;
      if (this.props.type === "api") {
        data = await this.fetchFromApi(this.props.endpoint.path);
      }
      else {
        data = await this.props.fetchData();
      }

      this.setState({
        data,
        loadingError: undefined,
      });
    }
    catch (err) {
      console.warn(`Error loading data:`, err);
      this.setState({ loadingError: err });
    }
    finally {
      // If you receive an error on this line "Objects are not valid as a React child"
      // It is not a problem with the DataFetcher - somewhere in a DataFetcher's child you have put an object in JSX that should be a string
      // The browser console will contain a trace of the errored element
      this.setState({ loaded: true });
    }
  }

  private async fetchFromApi(apiEndpoint: string): Promise<Data> {
    console.log(`Fetching ${apiEndpoint}...`);
    const res = await fetch(apiEndpoint);
    const data = await res.json();
    if (Object.keys(data).length === 0) {
      console.warn(`DataFetcher received empty response from ${apiEndpoint}`);
    }
    return data;
  }

  public render() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.state || !this.state.loaded) {
      const loadingDisplayType = this.props.loadingDisplay || "text";
      if (loadingDisplayType === "text") {
        return (
          <span style={this.props.loadingStyle} >Loading...</span>
        );
      }
      else if (loadingDisplayType === "spinner" || loadingDisplayType === "spinner-1em") {
        const loadingStyle = this.props.loadingStyle ?? {};

        if (loadingDisplayType === "spinner-1em") {
          loadingStyle.height = "1em";
          loadingStyle.width = "1em";
        }

        return (
          <Spinner style={loadingStyle} animation="border" variant="primary"/>
        );
      }
      else if (loadingDisplayType === "none") {
        return (<></>);
      }
      return loadingDisplayType;
    }
    else if (this.state.loadingError) {
      return (
        <span className="text-danger">
          Error fetching data: {this.state.loadingError}
        </span>
      );
    }
    else if (this.state.data == null) {
      return (
        <span className="text-danger">
          Unknown error fetching data
        </span>
      );
    }
    return this.props.children(this.state.data);
  }
}
