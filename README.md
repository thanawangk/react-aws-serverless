## Serverless Web Application (React + Cognito + API Gateway + Lambda + DynamoDB)

A simple serverless application where users **sign up/sign in with Cognito** and a **profile** record is stored in DynamoDB via a **Cognito PostConfirmation** trigger. The React app reads/updates the authenticated user’s profile through an **API Gateway + Lambda** endpoint protected by a **Cognito authorizer**.

## Prerequisites

- **AWS account** with permissions for Cognito, Lambda, API Gateway, DynamoDB, CloudWatch.
- **Node.js 18+**
- **Amplify CLI**: `npm i -g @aws-amplify/cli`
- **AWS CLI** configured with your profile (`aws configure`).

## Architecture Overview

Build a simple serverless web application using AWS services that allows user registration, authentication, and profile storage.

**AWS Components:**

- **Amazon Cognito** – User sign-up, sign-in, token management.
- **API Gateway** – REST API endpoints for profile retrieval and update.
- **AWS Lambda** – Serverless compute for backend logic.
- **DynamoDB** – Profile storage.

**Flow:**

1. User signs up/signs in via Cognito (React app with Amplify Auth).
2. On confirmation, a PostConfirmation Lambda stores the profile in DynamoDB (`profiles` table).
3. Authenticated requests (GET/PUT `/profile`) go through API Gateway with a Cognito Authorizer.
4. Lambda reads/writes the profile in DynamoDB using the user’s Cognito `sub` as the key.

**Data model:**

```json
{
  "userId": "string (Cognito sub)",
  "email": "string",
  "name": "string",
  "createdAt": "ISO timestamp"
}
```

## How to Deploy the App


1. **Clone or download this repository**:

```bash
git clone <repo-url>
cd <repo-folder>
```

2. **Install dependencies**:

```bash
npm install
```

3. **Backend auth (Cognito) with Amplify**
```bash
amplify init
amplify add auth 
# Choose "Default configuration" (email sign-in)
amplify push
```

> After `push`, Amplify generates `src/aws-exports.js` (used by the frontend).

4. **Profiles table (DynamoDB) via Amplify Storage**
```bash
amplify add storage
# Select: NoSQL Database
# Resource name: profiles
# Partition key: userId (String)
amplify push
```

5. **PostConfirmation trigger to create profile row**
```bash
amplify update auth 
# Add User Pool Triggers -> Post Confirmation -> create function
amplify update function 
# Select the PostConfirmation function -> grant access to storage: profiles (read/write)
```

Push the changes:
```bash
amplify push
```

6. **Profile API (API Gateway + Lambda)**

Create a Lambda for `/profile` (GET, PUT) and deploy it behind API Gateway with a **Cognito authorizer** attached.

**Example `lambdas/profile/src/handler.js`:**
```js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.PROFILES_TABLE || process.env.STORAGE_PROFILES_NAME;

const cors = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,PUT",
};

const getSub = (event) =>
  event.requestContext?.authorizer?.jwt?.claims?.sub ||
  event.requestContext?.authorizer?.claims?.sub;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const userId = getSub(event);
  if (!userId) return { statusCode: 401, headers: cors, body: JSON.stringify({ message: "Unauthorized" }) };
  if (!TABLE) return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "Table not configured" }) };

  try {
    if (event.httpMethod === "GET") {
      const res = await doc.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
      return { statusCode: 200, headers: cors, body: JSON.stringify(res.Item || null) };
    }
    if (event.httpMethod === "PUT") {
      const { name, email } = JSON.parse(event.body || "{}");
      const item = { userId, name, email, createdAt: new Date().toISOString() };
      await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
      return { statusCode: 200, headers: cors, body: JSON.stringify(item) };
    }
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: "Server error" }) };
  }
};
```

**API Gateway**
- Create an **REST API**.
- Add route `/profile` for **GET** and **PUT** -> integrate with the Lambda above.
- Create a **JWT/Cognito authorizer** using your User Pool issuer and App Client ID.
- Attach the authorizer to `/profile` to secure the endpoints.
- Deploy the API and note the stage URL.
7. **Frontend (React + Vite + TS)**

**Env vars (locally as `.env`):**
```
VITE_API_URL=https://xxxx.execute-api.<region>.amazonaws.com/prod
```

## How to test the app

**Unit tests (Lambda)**

Run tests:
```bash
npm install
npm test
```

---

**Sample unit test results**

```
 PASS  src/tests/custom.test.js
  PostConfirmation Lambda
    √ should skip if triggerSource is not PostConfirmation_ConfirmSignUp (3 ms)                                                                                       
    √ should throw error if no sub in attributes (9 ms)                                                                                                               
    √ should throw error if table env variable is missing (79 ms)                                                                                                     
    √ should put item to DynamoDB when valid event (20 ms)                                                                                                            
    √ should throw error if item already exists (idempotency) (263 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.92 s, estimated 2 s
Ran all test suites.
```