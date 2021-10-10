import http from 'http';
import express from 'express';
import compression from 'compression';

const app = express();
const server = http.createServer(app);

app.use(compression())
app.use(express.static('dist'));

server.listen(5000, () => console.log('server is running http://localhost:5000 ...'));
