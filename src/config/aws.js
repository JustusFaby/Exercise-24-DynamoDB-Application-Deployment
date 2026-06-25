const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

/**
 * Configure DynamoDB Client
 *
 * Requirements:
 * - Use AWS SDK v3
 * - Use DynamoDBDocumentClient
 * - Do NOT hardcode credentials (no accessKeyId, secretAccessKey, sessionToken)
 * - Automatically obtain credentials from IRSA
 */
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    // We intentionally leave credentials out. The AWS SDK will automatically
    // load them from the environment via the WebIdentityToken provided by IRSA.
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

module.exports = {
    ddbDocClient,
};
