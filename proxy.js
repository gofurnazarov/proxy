const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', async (req, res) => {
  try {
    const { url } = req.query; // Get the target URL
    const response = await axios.get(url);
    res.json(response.data); // Forward the response to the client
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
