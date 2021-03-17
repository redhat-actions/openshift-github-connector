import React from "react";
import { RouteComponentProps } from "react-router-dom";

export default abstract class DataLoadingPage<Data> extends React.Component<RouteComponentProps, {
    data: Data | undefined,
    loaded: boolean
    loadingError: Error | undefined,
}> {

    constructor(
        props: RouteComponentProps,
        private readonly dataEndpointPath: string
    ) {
        super(props);
        this.state = { data: undefined, loadingError: undefined, loaded: false };
    }

    async componentDidMount(): Promise<void> {
        try {
            console.log(`Fetching ${this.dataEndpointPath}...`);
            const res = await fetch(this.dataEndpointPath);
            const data = await res.json();
            this.setState({
                data,
                loadingError: undefined,
            });
        }
        catch (err) {
            console.warn(`Error loading data from ${this.dataEndpointPath}`, err);
            this.setState({ loadingError: err });
        }
        finally {
            this.setState({ loaded: true });
        }
    }

    protected getData(): Data | undefined {
        return this.state.data;
    }

    protected abstract renderPage(): JSX.Element;

    public render(): JSX.Element {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.state || !this.state.loaded) {
            return (
                <React.Fragment>
                    <h1>Loading...</h1>
                </React.Fragment>
            );
        }
        else if (this.state.loadingError) {
            return (
                <React.Fragment>
                    <h2>Error fetching data:</h2>
                    <h4>{this.state.loadingError}</h4>
                </React.Fragment>
            );
        }
        return this.renderPage();
    }
}
