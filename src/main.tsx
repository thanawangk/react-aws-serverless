import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { Amplify } from "aws-amplify";
import config from "./amplifyconfiguration.json";
Amplify.configure(config);

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Authenticator signUpAttributes={["name"]}>
      <App />
    </Authenticator>
  </StrictMode>
);
