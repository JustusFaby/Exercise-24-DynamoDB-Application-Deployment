const { v4: uuidv4 } = require('uuid');
const dynamodbService = require('../services/dynamodbService');

/**
 * POST /customers
 * Creates a new customer
 */
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const customerId = uuidv4();
        const customer = {
            customerId,
            name,
            email,
            phone,
            address,
        };

        const result = await dynamodbService.createCustomer(customer);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * GET /customers/:id
 * Reads a customer by ID
 */
const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        const customer = await dynamodbService.getCustomer(id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.status(200).json(customer);
    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * PUT /customers/:id
 * Updates an existing customer
 */
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        // Validate if there's anything to update
        if (!name && !email && !phone && !address) {
            return res.status(400).json({ error: 'No update fields provided' });
        }

        // Check if customer exists first
        const existingCustomer = await dynamodbService.getCustomer(id);
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const updateData = { name, email, phone, address };
        const updatedCustomer = await dynamodbService.updateCustomer(id, updateData);

        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createCustomer,
    getCustomer,
    updateCustomer,
};
