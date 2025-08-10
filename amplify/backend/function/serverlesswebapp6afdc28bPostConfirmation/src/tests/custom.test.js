const path = require("path");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Mock the DynamoDB DocumentClient
const ddbMock = mockClient(DynamoDBDocumentClient);

process.env.STORAGE_PROFILES_NAME = "TestTable";

const { handler } = require("../custom.js");

const loadHandlerFresh = () => {
  jest.resetModules();
  const mod = require(path.join("..", "custom.js"));
  return mod.handler; // writeUserProfile
};

describe("writeUserProfile Lambda", () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  const baseEvent = {
    triggerSource: "PostConfirmation_ConfirmSignUp",
    request: {
      userAttributes: {
        sub: "123",
        email: "test@example.com",
        name: "Test User",
      },
    },
  };

  test("should skip if triggerSource is not PostConfirmation_ConfirmSignUp", async () => {
    const event = { triggerSource: "SomethingElse" };
    const result = await handler(event);
    expect(result).toEqual(event);
    expect(ddbMock.calls()).toHaveLength(0);
  });

  test("should throw error if no sub in attributes", async () => {
    const event = {
      triggerSource: "PostConfirmation_ConfirmSignUp",
      request: { userAttributes: {} },
    };
    await expect(handler(event)).rejects.toThrow("No sub in userAttributes");
  });

  test("should throw error if table env variable is missing", async () => {
    delete process.env.STORAGE_PROFILES_NAME;

    const handler = loadHandlerFresh();

    await expect(handler(baseEvent)).rejects.toThrow(
      "PROFILES_TABLE env missing (looking for STORAGE_PROFILES_NAME)"
    );
  });

  test("should put item to DynamoDB when valid event", async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = {
      triggerSource: "PostConfirmation_ConfirmSignUp",
      request: {
        userAttributes: {
          sub: "123",
          email: "test@example.com",
          name: "Test User",
        },
      },
    };
    const result = await handler(event);
    expect(result).toEqual(event);
    expect(ddbMock.calls()).toHaveLength(1);

    const call = ddbMock.call(0);
    expect(call.args[0].input.TableName).toBe("TestTable");
    expect(call.args[0].input.Item.userId).toBe("123");
    expect(call.args[0].input.Item.email).toBe("test@example.com");
  });

  test("should throw error if item already exists (idempotency)", async () => {
    process.env.STORAGE_PROFILES_NAME = "profiles-dev";
    ddbMock.on(PutCommand).rejects({
      name: "ConditionalCheckFailedException",
      message: "already exists",
    });

    const handler = loadHandlerFresh();

    await expect(handler(baseEvent)).rejects.toMatchObject({
      name: "AccessDeniedException",
    });
  });
});
