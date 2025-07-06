import connectdb from "./db/connection.js";
import dotenv from 'dotenv'; //jaisay he connect ho waisay he env var har jagah accisble hojae 
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config({
    path:'./env'
})
const app=express();

app.use(express.json({     //for json data
    limit:'10kb'
}))
app.use(express.urlencoded({    //for url data
    extended:true,
    limit:'10kb'
}))
app.use(express.static('public'));  //for storing images/pdfs

app.use(cors({       // for cross origin
    origin:process.env.ORIGIN,
    Credentials:true
}));

app.use(cookieParser());  //for cookie parser

connectdb()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`);
    })
}).catch((error)=>{
    console.log(error);
})

export {app};