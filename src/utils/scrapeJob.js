const Axios=require('axios')
const { sendLinksToQueue, deleteQueue } = require('../middleware/sqs')

let pageCounter=0,depthCounter=0
let newLinks=[],linksInDepth=[]
let workersSent=0,workersDone=0
let requestedDepth=0,requestedPages=0
let currentQueueUrl,currentQueueName

let workerURL=`http://localhost:3040/start-scarping-page`

const scrapeUrl=async (url,maxDepth,maxPages,queueUrl,QueueName)=>{
    console.log("scraping- " + url, maxDepth,maxPages)
    requestedDepth=maxDepth
    requestedPages=maxPages
    currentQueueUrl=queueUrl
    currentQueueName=QueueName
    let tree={}
    try{
        if(!url.includes("https://")) { url="https://"+url } 
        const res=await Axios.post(workerURL,{queueUrl,depthCounter,QueueName})
        if(!res.data){return undefined}
        tree=res.data
        if(maxDepth===0){return tree}
        for(let i=0;i<tree.treeChildren.length;i++){
            linksInDepth.push(tree.treeChildren[i].link)
        }
        sendLinksToQueue(linksInDepth,queueUrl)
        pageCounter++
        depthCounter++
        newLinks=[]
        console.log("links in depth- "+linksInDepth.length+ " current depth - "+ depthCounter)
        scrapeLevel(maxPages,queueUrl,QueueName,linksInDepth.length,depthCounter,tree)
        return tree
    }catch(err){
        console.log(err)
    }
}

const scrapeLevel=async(maxPages,queueUrl,QueueName,totalLinks,depthCounter,tree)=>{
    let workerScrapeIndex=maxPages-pageCounter<totalLinks?maxPages-pageCounter:totalLinks
    console.log(workerScrapeIndex+" number of total urls needed to scrape")
    workersSent=Math.floor(workerScrapeIndex/7)+1
    for(let i=0;i<=workersSent;i++){
        Axios.post(workerURL,{queueUrl,depthCounter,QueueName,tree})
    }
}
const workerDone=async (req, res) =>{
    workersDone++
    console.log("done once workers sent- "+workersDone+" will reach "+workersSent)
    let pagesScraped=req.body.pagesScraped
    for(let j=0;j<pagesScraped.length;j++){
        let validPage=true
        pagesScraped[j]?.pageTitle?"":validPage=false;
        for(let i=0;i<linksInDepth.length;i++){
            if(!validPage){
                if(linksInDepth[i]===pagesScraped[j]){
                    linksInDepth.splice(i,1)
                    break;
                }
            }
            else{
                pageCounter++
                if(linksInDepth[i]===pagesScraped[j].pageUrl){
                    linksInDepth.splice(i,1)
                    newLinks=[...newLinks,...pagesScraped[j].pageLinks]
                    break;
                }
            }
        }
    }
    if(linksInDepth.length===0){
        depthCounter++
        if(pageCounter>=requestedPages|| depthCounter===requestedDepth){
            try{
                console.log("deleting queue")
                deleteQueue(currentQueueUrl)
            }catch(err){
                console.log(err)
            }
            res.send("done")
        }
        linksInDepth=[...newLinks]
        sendLinksToQueue(linksInDepth,currentQueueUrl)
        workersDone=0
        scrapeLevel(requestedPages,currentQueueUrl,currentQueueName,linksInDepth.length,depthCounter,req.body.tree)
    }
    else if(workersDone===workersSent){
        workersDone=0
        scrapeLevel(requestedPages,currentQueueUrl,currentQueueName,linksInDepth.length,depthCounter,req.body.tree)
    }
    res.send("ok")
}

module.exports={workerDone,scrapeUrl}