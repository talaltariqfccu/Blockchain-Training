import express from 'express';
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDb from './db/connects.js';
import router from "./routes/home.js";

dotenv.config();
connectDb(process.env.DATABASEURL);  //connecting database  

const app = express();
app.use(bodyParser.json());
const port =  process.env.PORT  ;

app.use(`/user`,router);

app.listen(port ,()=>{console.log(`Server is running on http://localhost:${port}`)});