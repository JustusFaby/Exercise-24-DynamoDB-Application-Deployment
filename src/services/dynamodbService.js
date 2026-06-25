const { PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient } = require('../config/aws');

const TABLE_NAME = process.env.TABLE_NAME || 'Customers';

/**
 * Creates a new customer in DynamoDB
 * @param {Object} customer - The customer object containing customerId, name, email, phone, address
 * @returns {Promise<Object>} The inserted customer object
 */
const createCustomer = async (customer) => {
    const params = {
        TableName: TABLE_NAME,
        Item: customer,
    };
    await ddbDocClient.send(new PutCommand(params));
    return customer;
};

/**
 * Retrieves a customer from DynamoDB by customerId
 * @param {string} customerId - The unique ID of the customer
 * @returns {Promise<Object|null>} The customer object if found, otherwise null
 */
const getCustomer = async (customerId) => {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            customerId: customerId,
        },
    };
    const response = await ddbDocClient.send(new GetCommand(params));
    return response.Item || null;
};

/**
 * Updates an existing customer in DynamoDB
 * @param {string} customerId - The unique ID of the customer
 * @param {Object} updateData - An object containing fields to update (name, email, phone, address)
 * @returns {Promise<Object>} The updated customer attributes
 */
const updateCustomer = async (customerId, updateData) => {
    // Construct the UpdateExpression and ExpressionAttributeValues dynamically based on provided fields
    let updateExpression = 'set';
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};
    
    if (updateData.name) {
        updateExpression += ' #name = :name,';
        expressionAttributeValues[':name'] = updateData.name;
        expressionAttributeNames['#name'] = 'name';
    }
    if (updateData.email) {
        updateExpression += ' #email = :email,';
        expressionAttributeValues[':email'] = updateData.email;
        expressionAttributeNames['#email'] = 'email';
    }
    if (updateData.phone) {
        updateExpression += ' #phone = :phone,';
        expressionAttributeValues[':phone'] = updateData.phone;
        expressionAttributeNames['#phone'] = 'phone';
    }
    if (updateData.address) {
        updateExpression += ' #address = :address,';
        expressionAttributeValues[':address'] = updateData.address;
        expressionAttributeNames['#address'] = 'address';
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);

    const params = {
        TableName: TABLE_NAME,
        Key: { customerId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ReturnValues: 'ALL_NEW',
    };

    const response = await ddbDocClient.send(new UpdateCommand(params));
    return response.Attributes;
};

module.exports = {
    createCustomer,
    getCustomer,
    updateCustomer,
};
