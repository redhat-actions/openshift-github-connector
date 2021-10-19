import { Title } from "@patternfly/react-core";
import { Table } from "@patternfly/react-table";
import { ReactNode } from "react";

export function ObjectTable(
  { className, obj, label }:
  { className?: string, obj: Record<string | number, ReactNode>, label: string }
): JSX.Element {

  return (
    <div className={className}>
      <Title headingLevel="h3" className="border-bottom pb-3">{label}</Title>
      <Table aria-label={label}>
        <tbody>
          {Object.entries(obj).map(([ key, value ], i) => {
            return (
              <tr key={i}>
                <td className="b w-50">
                  {key}
                </td>
                <td>
                  {value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
