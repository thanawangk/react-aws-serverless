// amplify/backend/function/<PostConfirmation>/src/custom.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Prefer the profiles table; keep fallbacks to avoid future renames
const TABLE =
  process.env.STORAGE_PROFILES_NAME ||
  process.env.STORAGE_USERS_NAME || // old name fallback
  process.env.PROFILES_TABLE || // manual override (optional)
  process.env.USERS_TABLE; // manual override (optional)

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

async function writeUserProfile(event) {
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") return event;

  if (!TABLE) {
    console.error(
      "No table env found. Have you granted storage access to this function?"
    );
    throw new Error(
      "USERS_TABLE env missing (looking for STORAGE_PROFILES_NAME)"
    );
  }

  const a = event.request.userAttributes || {};
  const sub = a.sub;
  const email = a.email;
  const name = a.name || a.preferred_username || a.given_name || "";

  if (!sub) throw new Error("No sub in userAttributes");

  const item = {
    userId: sub,
    email,
    name,
    createdAt: new Date().toISOString(),
  };

  console.log("Putting item to", TABLE, item);

  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return event;
}

exports.handler = writeUserProfile;
exports.postConfirmation = writeUserProfile;
