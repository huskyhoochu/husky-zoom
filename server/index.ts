import http from 'http';
import express from 'express';
import compression from 'compression';

const app = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

app.use(compression())
app.use(express.static(isProd ? 'client' : 'dist/client'));

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`server is running http://localhost:${PORT} ..`));
