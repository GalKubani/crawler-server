const express= require('express');
const scrapeUrl = require('../utils/scrapeJob');
const router= new express.Router();

router.get('/start-scarping',async(req,res)=>{
    try{
        const result= await scrapeUrl(req.body.url,req.body.maxDepth,req.body.maxPages)
        return result
    }catch(err){
        console.log(err)
    }
})

module.exports=router