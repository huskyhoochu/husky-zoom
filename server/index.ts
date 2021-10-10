import http from 'http';
import express from 'express';
import compression from 'compression';

const app = express();
const server = http.createServer(app);

app.use(compression())
app.use(express.static('dist'));

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`server is running http://localhost:${PORT} ..`));
