const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE = process.env.STORAGE_PROFILES_NAME || process.env.PROFILES_TABLE;

// Fake client
let doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
function __setDocClient(fake) {
  doc = fake;
}

async function writeUserProfile(event) {
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") return event;

  if (!TABLE) {
    console.error(
      "No table env found. Have you granted storage access to this function?"
    );
    throw new Error(
      "PROFILES_TABLE env missing (looking for STORAGE_PROFILES_NAME)"
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

exports.__setDocClient = __setDocClient;
