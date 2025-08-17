// /task CRUD
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateCommand,
  PutCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH,DELETE",
};

const getUserId = (event) => {
  const a = event.requestContext?.authorizer;
  // REST API
  if (a?.claims?.sub) return a.claims.sub;
  return null;
};

export const handler = async (event, context) => {
  let response;

  switch (event.httpMethod) {
    case "GET":
      response = await handleGetRequest();
      break;
    case "POST":
      response = await handlePostRequest(event, context);
      break;
    case "PATCH":
      response = await handlePatchRequest(event);
      break;
    case "DELETE":
      response = await handleDeleteRequest(event);
      break;
    default:
      response = {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request type",
          event: event,
          context: context,
        }),
      };
  }
  return response;
};

const handleGetRequest = async () => {
  const command = new ScanCommand({
    TableName: "tasks",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify(response.Items),
  };
};

const handlePostRequest = async (event, context) => {
  const { name, completed } = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: "tasks",
    Item: {
      id: context.awsRequestId,
      name,
      completed,
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ message: "Task created successfully" }),
  };
};

export const handlePatchRequest = async (event, context) => {
  const { id, name, completed } = JSON.parse(event.body);

  const command = new UpdateCommand({
    TableName: "tasks",
    Key: {
      id,
    },
    ExpressionAttributeNames: {
      "#name": "name",
    },
    UpdateExpression: "set #name = :n, completed = :c",
    ExpressionAttributeValues: {
      ":n": name,
      ":c": completed,
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      message: "Task updated successfully",
      task: response.Attributes,
    }),
  };
};

const handleDeleteRequest = async (event) => {
  const { id } = JSON.parse(event.body);

  const command = new DeleteCommand({
    TableName: "tasks",
    Key: { id },
    ReturnValues: "ALL_OLD",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      message: "Task deleted successfully",
      task: response.Attributes,
    }),
  };
};