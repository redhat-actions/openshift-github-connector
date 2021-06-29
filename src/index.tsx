import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

// note PF is excluded in the console by webpack.config.plugin
import "@patternfly/react-core/dist/styles/base.css";

import "./client/styles/index.scss";

import App from "./client/app";
import reportWebVitals from "./client/reportWebVitals";

function Router(): JSX.Element {
  return (
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
