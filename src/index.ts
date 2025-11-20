import express from 'express';
import dotenv from 'dotenv';
import router from './routes';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors({
  origin:['http://localhost:5173'], credentials:true
}))

app.use(express.json());
app.use("/api", router);
// Basic route
app.get('/', (req, res) => {
  res.send('CRM PT. Smart is running!');
});

export default app;