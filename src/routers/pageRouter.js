const express= require('express');
const checkTreeOnDB = require('../middleware/mongo');
const { getPagesFromRedis} = require('../middleware/redis');
const { createQueue,sendMessageToQueue} = require('../middleware/sqs');
const {scrapeUrl,workerDone} = require('../utils/scrapeJob');
const router= new express.Router();


router.post('/start-scarping',checkTreeOnDB,createQueue,sendMessageToQueue,async(req,res)=>{
    try{
        const result= await scrapeUrl(req.body.url,req.body.maxDepth,req.body.maxPages,req.queueUrl,req.body.QueueName,req.body.tree||undefined)
        res.send(result)
    }catch(err){
        console.log(err)
    }
})

router.post('/worker-done',workerDone)

router.get('/get-pages',getPagesFromRedis)

module.exports=router