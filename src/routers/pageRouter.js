const express= require('express');
const { createQueue,sendMessageToQueue,deleteQueue } = require('../middleware/sqs');
const scrapeUrl = require('../utils/scrapeJob');
const router= new express.Router();


router.post('/start-scarping',createQueue,sendMessageToQueue,deleteQueue,async(req,res)=>{
    try{
        const result= await scrapeUrl(req.body.url,req.body.maxDepth,req.body.maxPages,req.queueUrl)
        res.send(result)
    }catch(err){
        console.log(err)
    }
})

module.exports=router