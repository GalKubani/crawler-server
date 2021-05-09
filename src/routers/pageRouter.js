const express= require('express');
const { getPagesFromRedis } = require('../middleware/redis');
const { createQueue,sendMessageToQueue,deleteQueue } = require('../middleware/sqs');
const scrapeUrl = require('../utils/scrapeJob');
const router= new express.Router();


router.post('/start-scarping',createQueue,sendMessageToQueue,async(req,res)=>{
    try{
        const result= await scrapeUrl(req.body.url,req.body.maxDepth,req.body.maxPages,req.queueUrl,req.body.QueueName)
        deleteQueue(req.queueUrl)
        res.send(result)
    }catch(err){
        console.log(err)
    }
})

router.get('/get-pages',getPagesFromRedis,async(req,res)=>{res.send([])})

module.exports=router