const express=require('express')
const cors= require('cors')
const scrapeUrl = require('./src/utils/scrapeJob')
const port= process.env.PORT

const app= express()

app.use(cors())
app.use(express.json())
const test=async()=>{
    await scrapeUrl("www.google.com",3,520)
    console.log("ended")
}
test()
app.use('/',(req,res)=>{
    res.send("ok")
})

app.listen(port,()=> console.log("server on port:", port))