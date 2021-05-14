const Axios=require('axios')
const { sendLinksToQueue, deleteQueue } = require('../middleware/sqs')

let pageCounter=0,depthCounter=0
let newLinks=[],linksInDepth=[]
let workersSent=0,workersDone=0
let requestedDepth=0,requestedPages=0
let currentQueueUrl,currentQueueName

let workerURL=`http://localhost:3040/start-scarping-page`

const scrapeUrl=async (url,maxDepth,maxPages,queueUrl,QueueName,currentTree)=>{
    console.log("scraping- " + url, maxDepth,maxPages)
    requestedDepth=maxDepth
    requestedPages=maxPages
    currentQueueUrl=queueUrl
    currentQueueName=QueueName
    let tree=currentTree||{}
    try{
        
        if(!url.includes("https://")) { url="https://"+url } 
        if(!currentTree){
            const res=await Axios.post(workerURL,{queueUrl,depthCounter,QueueName})
            if(!res.data){return undefined}
            tree=res.data
        }
        if(maxDepth===0){return tree}
        // will nn to update page count incase of existing tree
        // will also nn to check where scraping continues from
        for(let i=0;i<tree.treeChildren.length;i++){
            linksInDepth.push(tree.treeChildren[i].link)
        }
        sendLinksToQueue(linksInDepth,queueUrl)
        pageCounter++
        depthCounter++
        newLinks=[]
        console.log("links in depth- "+linksInDepth.length+ " current depth - "+ depthCounter)
        scrapeLevel(maxPages,queueUrl,QueueName,linksInDepth.length,depthCounter,tree._id)
        return tree
    }catch(err){
        console.log(err)
    }
}

const scrapeLevel=async(maxPages,queueUrl,QueueName,totalLinks,depthCounter,treeId)=>{
    let workerScrapeIndex=maxPages-pageCounter<totalLinks?maxPages-pageCounter:totalLinks
    console.log("total links to scrape in depth- "+workerScrapeIndex)
    workersSent=Math.floor(workerScrapeIndex/5)+1
    for(let i=0;i<=workersSent;i++){
        Axios.post(workerURL,{queueUrl,depthCounter,QueueName,treeId})
    }
}
const workerDone=async (req, res) =>{
    workersDone++
    let pagesScraped=req.body.pagesScraped
    for(let j=0;j<pagesScraped.length;j++){
        let validPage=false
        pagesScraped[j]?.pageTitle?validPage=true:"";
        for(let i=0;i<linksInDepth.length;i++){
            if(!validPage){
                if(linksInDepth[i]===pagesScraped[j]+""){
                    linksInDepth.splice(i,1)
                    break;
                }
            }
            else{
                if(linksInDepth[i]===pagesScraped[j].pageUrl+""){
                    pageCounter++
                    linksInDepth.splice(i,1)
                    newLinks=[...newLinks,...pagesScraped[j].pageLinks]
                    break;
                }
            }
        }
    }   

    console.log("active workers remaining- "+(workersSent-workersDone))
    if(linksInDepth.length===0 && workersDone===workersSent){checkAndAssignWorkers(req.body.treeId) }
    else if(workersDone===workersSent){
        workersDone=0
        scrapeLevel(requestedPages,currentQueueUrl,currentQueueName,linksInDepth.length,depthCounter,req.body.treeId)
    }
    res.send("ok")
}
const checkAndAssignWorkers=(treeId)=>{
    depthCounter++
    if(pageCounter>=requestedPages|| depthCounter>requestedDepth){
        try{
            console.log("deleting queue")
            deleteQueue(currentQueueUrl)
        }catch(err){ console.log(err)}
    }
    linksInDepth=[...newLinks]

    if(linksInDepth.length>requestedPages-pageCounter){ linksInDepth=linksInDepth.splice(0,requestedPages-pageCounter),currentQueueUrl}
    sendLinksToQueue(linksInDepth,currentQueueUrl)
    workersDone=0
    scrapeLevel(requestedPages,currentQueueUrl,currentQueueName,linksInDepth.length,depthCounter,treeId)
}
module.exports={workerDone,scrapeUrl}