import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface LinkButtonProps {
    icon: IconProp,
    label: string,
    href: string,
    tooltip?: string,
    style?: React.CSSProperties
}

export default class LinkButton extends React.Component<LinkButtonProps> {
    render(): JSX.Element {
        const tooltip = this.props.tooltip ?? this.props.label;

        return (
            <a role="button" target="_blank"
                href={this.props.href}
                className="mr-2 btn btn-outline-primary"
                data-toggle="tooltip" title={tooltip}
                style={this.props.style}
            >
                <FontAwesomeIcon icon={this.props.icon} className="mr-2"/>
                <span className="font-weight-bold">
                    {this.props.label}
                </span>
            </a>
        );
    }
}
