import {
  PageSidebar, Nav, NavList, NavItem, NavItemSeparator,
} from "@patternfly/react-core";
import { Link } from "react-router-dom";

import ClientPages from "./client-pages";
import { ConnectorUserInfo } from "../../common/types/user-types";

type SideBarPage = { path: string, title: string };

type SideBarPages = {
  top: SideBarPage[],
  bottom: SideBarPage[],
};

export function getSidebarPages(user: ConnectorUserInfo): SideBarPages {

  let top: SideBarPage[];
  let bottom: SideBarPage[];

  if (user.githubInstallationInfo) {
    top = [
      ClientPages.ConnectRepos,
      ClientPages.AddWorkflowsIndex,
      ClientPages.ImageRegistries,
    ];

    bottom = [
      ClientPages.App,
      ClientPages.SetupIndex,
    ];
  }
  else if (user.ownsAppIds.length > 0) {
    top = [
      ClientPages.App,
      ClientPages.SetupIndex,
    ];

    bottom = [];
  }
  else {
    top = [];
    bottom = [];
  }

  return { top, bottom };
}

export function MySidebar(
  { isNavOpen, sidebarPages }:
  { isNavOpen: boolean, sidebarPages: SideBarPages }
) {
  return (
    <PageSidebar
      theme="dark"
      className="text-light h-100"
      nav={
        <>
          <Nav>
            <NavList>
              {
                sidebarPages.top.map((page) => {
                  return (
                    <NavItem key={page.path}>
                      <Link to={page.path}>{page.title}</Link>
                    </NavItem>
                  );
                })
              }
            </NavList>
            <div className="spacer" />
            <NavItemSeparator className="mb-0" />
            <NavList>
              {
                sidebarPages.bottom.map((page) => {
                  return (
                    <NavItem key={page.path}>
                      <Link to={page.path}>{page.title}</Link>
                    </NavItem>
                  );
                })
              }
            </NavList>
          </Nav>
        </>
      }

      isNavOpen={isNavOpen}
    />
  );
}
