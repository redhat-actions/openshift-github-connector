import {
  Card, CardTitle, Button, CardBody,
} from "@patternfly/react-core";
import { CommonIcons } from "../util/icons";
import BtnBody from "./btn-body";
import DataFetcher, { DataFetcherProps } from "./data-fetcher";

export function DataFetcherCard<T>(props: DataFetcherProps<T> & { title: string }): JSX.Element {

  return (
    <DataFetcher loadingDisplay="card" {...props}>{
      (data: T, reload) => {
        return (
          <Card>
            <CardTitle>
              <div>
                {props.title}
              </div>
              <div className="ms-auto">
                <div className="btn-line">
                  <Button variant="primary"
                    onClick={async () => {
                      await reload();
                    }}
                  >
                    <BtnBody icon={CommonIcons.Reload} text="Reload"/>
                  </Button>
                </div>
              </div>
            </CardTitle>
            <CardBody>
              {props.children(data, reload)}
            </CardBody>
          </Card>
        );
      }
    }
    </DataFetcher>
  );
}
