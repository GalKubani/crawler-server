const Tree= require('../models/treeModel')


const checkTreeOnDB= async(req,res,next)=>{
    try{
        let tree= await Tree.findOne({pageUrl:"https://"+req.body.url})
        
        if(tree){
            if(req.body.maxPages<=tree.totalPagesScraped){
                return res.send(tree)
            }
            req.body.tree=tree
            // nn to add tree into request
        }
        next()
    }catch(err){
        console.log(err)
    }
}
module.exports=checkTreeOnDB