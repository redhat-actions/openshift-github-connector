// https://create-react-app.dev/docs/proxying-api-requests-in-development#configuring-the-proxy-manually

/* eslint-disable */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = (app) => {

  app.use((req, res, next) => {
    // Redirect http traffic to https
    if (!req.secure) {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    return next();
  });


  app.use(
    "/api",
    createProxyMiddleware({
      target: "https://localhost:3443",
      // changeOrigin: true,
      // https://github.com/facebook/create-react-app/issues/3823#issuecomment-366931838
      secure: false,
    }),
  );
};
