# OpenShift Actions Connector

Coming soon...

### Project Structure

The backend is in Express, and the frontend is in React using create-react-app (CRA). Code can be shared across the stack from the `common/` directory.

The structure is adapted from [this blog post](https://spin.atomicobject.com/2020/08/17/cra-express-share-code), and the boilerplate code is in [this repository](https://github.com/gvanderclay/cra-express).

Run `yarn dev` to run the development server.

### Development gotchas
CRA seems to have problems if you rename or delete a TypeScript file. It will keep trying to compile the old one. Restarting the development server fixes it.

Similarly, if you edit the ESLint config file, the change will not get picked up until a dev server restart.
