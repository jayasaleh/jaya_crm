import express from 'express';
import dotenv from 'dotenv';
import router from './routes';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin:['http://localhost:5173'], credentials:true
}))
app.use(express.json());
app.use("/api", router);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;