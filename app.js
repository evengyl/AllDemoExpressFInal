const express = require('express');
const pagination = require('./middlewares/pagination-middleware');
const cors = require('cors');

// Permet d'avoir une propagation des erreurs avec les async/await dans express
require('express-async-errors');

// Load env file
require('dotenv-flow').config();

// Get env variable
const { PORT, NODE_ENV } = process.env;

// Create Web API
const app = express();

// Add Middlewares
app.use(express.json());
app.use(pagination());
app.use(cors());

// Initialize Database
const db = require('./models');
db.sequelize.authenticate()
    .then(() => console.log('Connection DB - OK'))
    .catch((error) => console.log('Connection DB - Error', error));

// Sync between models and database (Required DDL right)
if (NODE_ENV !== 'production') {
    // db.sequelize.sync();
}

// Add Routing
const router = require('./routes');
app.use('/api', router);

// Add Error Handler
app.use((error, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(error);
        return res.status(500).json(error);
    }
    res.sendStatus(500);
});

// Start Web API
app.listen(PORT, () => {
    console.log(`Web API up on port ${PORT}  [${NODE_ENV}]`);
});