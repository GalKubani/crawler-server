const express= require('express');
const scrapeUrl = require('../utils/scrapeJob');
const router= new express.Router();

router.get('/start-scarping',auth,async(req,res)=>{
    try{
        const result= await scrapeUrl(req.url,req.maxDepth,req.maxPages)
        console.log(result)
        return result
    }catch(err){
        console.log(err)
    }
})

module.exports=router