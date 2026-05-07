require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/swaps', require('./routes/swaps'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT || 3004, () =>
      console.log(`Swap service on port ${process.env.PORT || 3004}`)
    );
  })
  .catch(err => console.error('DB connection failed:', err));
