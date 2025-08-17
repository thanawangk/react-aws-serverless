// /profile
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = "profiles-dev";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT",
  "Content-Type": "application/json",
};


const getUserId = (event) => {
  const a = event?.requestContext?.authorizer;
  return a?.jwt?.claims?.sub || a?.claims?.sub || null;
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const userId = getUserId(event);
  if (!userId) {
    return { statusCode: 401, headers, body: JSON.stringify({ message: "Unauthorized" }) };
  }

  try {
    switch (event.httpMethod) {
      case "GET":
        return await getProfile(userId);
      case "POST":
        return await createProfile(event, userId);
      case "PUT":
        return await putProfile(event, userId);
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ message: "Invalid request type" }) };
    }
  } catch (err) {
    console.error("ERR:", err);
    const msg = err?.name === "ConditionalCheckFailedException"
      ? "Profile does not exist or you don’t own it."
      : (err?.message || "Server error");
    return { statusCode: 500, headers, body: JSON.stringify({ message: msg }) };
  }
};

async function getProfile(userId) {
  const resp = await doc.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  return { statusCode: 200, headers, body: JSON.stringify(resp.Item ?? {}) };
}

async function putProfile(event, userId) {
  const body = safeJson(event.body);
  if (!body || (typeof body.name === "undefined" && typeof body.email === "undefined")) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Nothing to update" }) };
  }

  // Build expressions safely (no stray commas)
  const names = {};
  const values = { ":t": new Date().toISOString(), ":u": userId };
  const sets = ["updatedAt = :t"]; // always update timestamp

  if (typeof body.name !== "undefined") {
    names["#name"] = "name";
    values[":n"] = body.name;
    sets.push("#name = :n");
  }
  if (typeof body.email !== "undefined") {
    values[":e"] = body.email;
    sets.push("email = :e");
  }

  const resp = await doc.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId },                         // <— PK is userId
    ConditionExpression: "userId = :u",      // ensure only owner updates
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return { statusCode: 200, headers, body: JSON.stringify({ message: "Profile updated", profile: resp.Attributes }) };
}

function safeJson(s) {
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}
