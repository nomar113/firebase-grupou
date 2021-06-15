const express = require('express');
const cors = require('cors');

const Controller = require("../controllers/FormationsController");

const app = express();
const controller = new Controller();

app.use(cors({ origin: true }));

app.post('/', controller.create);

module.exports = app;