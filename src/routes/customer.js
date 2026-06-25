const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// POST /customers - Create a new customer
router.post('/customers', customerController.createCustomer);

// GET /customers/:id - Read customer from DynamoDB
router.get('/customers/:id', customerController.getCustomer);

// PUT /customers/:id - Update customer in DynamoDB
router.put('/customers/:id', customerController.updateCustomer);

module.exports = router;
