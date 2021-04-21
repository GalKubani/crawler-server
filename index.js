const express=require('express')
const cors= require('cors')
const port= process.env.PORT

const app= express()
const pageRouter=require('./src/routers/pageRouter')
app.use(cors())
app.use(express.json())
app.use(pageRouter)
app.use('/',(req,res)=>{
    res.send("ok")
})

app.listen(port,()=> console.log("server on port:", port))