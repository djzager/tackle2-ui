// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
module.exports = {
  stylePaths: [
    path.resolve(__dirname, "../src"),
    path.resolve(__dirname, "../../node_modules/patternfly"),
    path.resolve(__dirname, "../../node_modules/@patternfly/patternfly"),
    path.resolve(__dirname, "../../node_modules/@patternfly/react-styles/css"),
    path.resolve(
      __dirname,
      "../../node_modules/@patternfly/react-core/dist/styles/base.css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@patternfly/react-core/dist/esm/@patternfly/patternfly"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@patternfly/react-core/node_modules/@patternfly/react-styles/css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@patternfly/react-table/node_modules/@patternfly/react-styles/css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@patternfly/react-inline-edit-extension/node_modules/@patternfly/react-styles/css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@redhat-cloud-services/frontend-components-notifications/index.css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@redhat-cloud-services/frontend-components-notifications/esm/Portal/portal.css"
    ),
    path.resolve(
      __dirname,
      "../../node_modules/@redhat-cloud-services/frontend-components-notifications/esm/Notification/notification.css"
    ),
  ],
};
