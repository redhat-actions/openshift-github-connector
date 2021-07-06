import React from "react";
import ApiResponses from "../common/api-responses";

export const UserContext = React.createContext<{
  user: ApiResponses.User,
  reload:(() => Promise<void>),
    }>({} as any);

export const InConsoleContext = React.createContext<boolean>(false);

// export const AppContext = React.createContext<GitHubAppConfigNoSecrets | undefined>(undefined);
