import express from "express";
import dotenv from 'dotenv';
import connectdb from "./db/connection.js";
dotenv.config({
    path:'./env'
})
const app=express();
const port=process.env.PORT;
connectdb().then(    //async code complete hota hai to apko aik promise bhi return karta hai
    app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})
).catch((error)=>{
    console.log(`mongodb connection failed: ${error}` )
})

app.get('/',(req,res)=>{
    res.send('hellow world')
})
// const port=process.env.PORT;
// app.listen(port,()=>{
//     console.log(`server is running on port ${port}`)
// })