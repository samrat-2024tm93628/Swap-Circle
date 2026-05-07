require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', proxy(process.env.AUTH_SERVICE_URL, {
  proxyReqPathResolver: req => `/auth${req.url}`
}));

app.use('/api/users', proxy(process.env.USER_SERVICE_URL, {
  proxyReqPathResolver: req => `/users${req.url}`
}));

app.use('/api/listings', proxy(process.env.LISTING_SERVICE_URL, {
  proxyReqPathResolver: req => `/listings${req.url}`
}));

app.use('/api/swaps', proxy(process.env.SWAP_SERVICE_URL, {
  proxyReqPathResolver: req => `/swaps${req.url}`
}));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () =>
  console.log(`API Gateway on port ${process.env.PORT || 3000}`)
);
