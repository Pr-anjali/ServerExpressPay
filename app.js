const dotenv = require("dotenv");
const mongoose = require('mongoose');
const express = require('express');
const cors = require("cors");
var cookieParser = require('cookie-parser');

const app = express();
dotenv.config({ path: './config.env' });
require('./db/conn');

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: '*', // Replace with the origin of your frontend
  credentials: true,
}));

app.use(require('./router/auth'));

const PORT = 5000;

app.get('/signin', (req, res) => {
  res.send('Hello login world from the server');
});

app.get('/signup', (req, res) => {
  res.send('Hello register world from the server');
});

app.listen(PORT, () => {
  console.log(`Server is running at port no. ${PORT}`);
});