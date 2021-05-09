const Axios=require('axios')
const { sendLinksToQueue } = require('../middleware/sqs')

let pageCounter=0
let newLinks=[]
let workerURL=`http://localhost:3040/start-scarping-page`

const scrapeUrl=async (url,maxDepth,maxPages,queueUrl,QueueName)=>{
    console.log("scraping- " + url, maxDepth,maxPages)
    let depthCounter=0
    let linksInDepth=[]
    let page={}
    try{
        if(!url.includes("https://")) { url="https://"+url } 
        const res=await Axios.post(workerURL,{queueUrl,depthCounter,QueueName})
        if(!res.data){return undefined}
        page=res.data
        if(maxDepth===0){return page}
        linksInDepth=[...page.pageLinks]
        sendLinksToQueue(linksInDepth,queueUrl)
        pageCounter++
        depthCounter++
        while(depthCounter<=maxDepth && pageCounter<=maxPages){
            newLinks=[]
            console.log("links in depth- "+linksInDepth.length+ " current depth - "+ depthCounter)
            await scrapeLevel(maxPages,queueUrl,QueueName,linksInDepth.length,depthCounter).then((res)=>{
                depthCounter=depthCounter+res
            })
            linksInDepth=[...newLinks]
            sendLinksToQueue(linksInDepth,queueUrl)
        }
        pageCounter=0
        return page
    }catch(err){
        console.log(err)
    }
}

const scrapeLevel=async(maxPages,queueUrl,QueueName,totalLinks,depthCounter)=>{
    let workerScrapeIndex=maxPages-pageCounter<totalLinks?maxPages-pageCounter:totalLinks
    console.log(workerScrapeIndex+" number of total request to be sent and fulfilled in this depth")
    await createWorkers(workerScrapeIndex,queueUrl,QueueName,depthCounter).then((res)=>{
        console.log(res)
    })
    return 1
}
const createWorkers=(workerScrapeIndex,queueUrl,QueueName,depthCounter)=>{
    return new Promise((resolve,reject)=>{
        let requestsSent=0
        let requestsComplete=0
        let workerInterval=setInterval(() => {
        if(requestsSent<=workerScrapeIndex){
            requestsSent++
            let page={}
            Axios.post(workerURL,{queueUrl,depthCounter,QueueName})
            .then((result)=>{
                page=result?.data
                if(page){
                    pageCounter++;
                    newLinks=[...newLinks,...page.pageLinks]
                } 
                else{requestsSent--}
                requestsComplete++
            }).catch((err)=>{
                console.log(err)
            })
        }
        else{
            if(requestsComplete>=workerScrapeIndex){
                clearInterval(workerInterval)
                resolve("complete")
            }
        }
    }, 50);
    })
}

module.exports=scrapeUrl