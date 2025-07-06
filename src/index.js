import connectdb from "./db/connection.js";
import dotenv from 'dotenv'; //jaisay he connect ho waisay he env var har jagah accisble hojae 

dotenv.config({
    path:'./env'
})

connectdb();