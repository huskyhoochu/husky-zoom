import http from 'http';
import path from 'path';
import express from 'express';
import compression from 'compression';

const app = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

const clientPath = isProd
  ? path.resolve(__dirname, '..', 'client')
  : path.resolve(__dirname, '..', 'dist', 'client');

const snowpackPath = isProd
  ? path.resolve(__dirname, '..', '_snowpack')
  : path.resolve(__dirname, '..', 'dist', '_snowpack');

app.use(compression());
app.use(express.static(clientPath));
app.use('/_snowpack', express.static(snowpackPath));

const PORT = process.env.PORT;
server.listen(PORT, () =>
  console.log(`server is running http://localhost:${PORT} ..`),
);
