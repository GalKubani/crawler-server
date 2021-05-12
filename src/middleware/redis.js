const redisClient = require('../db/redis');



const getPagesFromRedis = async(req,res)=> {
    try {
        let keys=await redisClient.keysAsync("Scraped page from Queue: "+req.query.key+"*")
        let pages=[]
        for (let key of keys){
            let page= await redisClient.getAsync(key)
            if(page){
                pages.push(JSON.parse(page))
            }
        }
        if (pages) {
            res.send(pages);
        }
        else res.send([])
    } catch (err) {
        console.log(err);
    }
};

const checkTreeOnDB= async(req,res,next)=>{
    try{
        let tree= await redisClient.getAsync("Scraped tree - https://"+req.body.url)
        // will nn to add check if tree is as long as requested
        if(tree){
            return res.send(JSON.parse(tree))
        }
        next()
    }catch(err){
        console.log(err)
    }
}

module.exports = {
    getPagesFromRedis,checkTreeOnDB
};