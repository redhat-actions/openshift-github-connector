import React from "react";

export default class LinkButton extends React.Component<{
    icon: string,
    label: string,
    href: string,
    tooltip?: string,
}> {
    render(): JSX.Element {
        const tooltip = this.props.tooltip || this.props.label;

        return (
            <a role="button" target="_blank"
                href={this.props.href}
                className="mr-2 btn btn-outline-dark"
                data-toggle="tooltip" title={tooltip}
            >
                <i className={"mr-2 fas " + this.props.icon}/>
                <span className="font-weight-bold">
                    {this.props.label}
                </span>
            </a>
        );
    }
}
