import express from 'express';
import dotenv from 'dotenv';
import router from './routes';
import cors from 'cors';

dotenv.config();

const app = express();
// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000',  // Alternative local port
  process.env.FRONTEND_URL, // Frontend URL from environment variable
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: allowedOrigins.length > 0 
    ? allowedOrigins 
    : true, // Allow all origins if no specific origin is set
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json());
app.use("/api", router);

app.get('/', (req, res) => {
  res.send('CRM PT. Smart is running!');
});
app.listen(process.env.PORT, () => {
  console.log('server is running');
});

export default app;