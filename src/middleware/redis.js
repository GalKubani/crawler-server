const redisClient = require('../db/redis');



const getPagesFromRedis = async (req, res, next) => {
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
        else next();
    } catch (err) {
        console.log(err);
    }
};


module.exports = {
    getPagesFromRedis
};