import { Table } from "@patternfly/react-table";

import { Stringable } from "../../common/common-util";
import { ExternalLink } from "./external-link";

export function ObjectTable({ obj, label }: { obj: Record<string | number, Stringable>, label: string }): JSX.Element {

  return (
    <Table aria-label={label}>
      <tbody>
        {Object.entries(obj).map(([ key, value ], i) => {
          const valueStr = value.toString();

          let valueElem: JSX.Element = <>{value.toString()}</>;
          if (valueStr.startsWith("http://") || valueStr.startsWith("https://")) {
            valueElem = <ExternalLink href={valueStr}>{valueStr}</ExternalLink>;
          }

          return (
            <tr key={i}>
              <td className="b">
                {key}
              </td>
              <td>
                {valueElem}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
