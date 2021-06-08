// https://create-react-app.dev/docs/proxying-api-requests-in-development#configuring-the-proxy-manually

/* eslint-disable */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      // changeOrigin: true,
    }),
  );
};
