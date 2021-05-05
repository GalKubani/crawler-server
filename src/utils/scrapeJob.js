const Axios=require('axios')
const { sendMessageToQueue, sendLinksToQueue } = require('../middleware/sqs')
const {scrapePage} = require('../../../crawler-worker/utils/scrapePage')

let pageCounter=0
let depthCounter=0
let linksInDepth=[]

let newLinks=[]
let workerURL=`http://localhost:3040/start-scarping-page`

const scrapeUrl=async (url,maxDepth,maxPages,queueUrl)=>{
    console.log("scraping- " + url, maxDepth,maxPages)
    let page={}
    try{
        if(!url.includes("https://")) { url="https://"+url } 
        await Axios.post(workerURL,{queueUrl,depthCounter})
            .then((result)=>{
                page=result.data
        })
        console.log(page)
        linksInDepth=[...page.pageLinks]
        sendLinksToQueue(linksInDepth,queueUrl)
        pageCounter++
        depthCounter++
        while(depthCounter<=maxDepth && pageCounter<=maxPages){
            newLinks=[]

            await scrapeLevel(maxPages,queueUrl)
            linksInDepth=[...newLinks]
        }
        return page
    }catch(err){
        console.log(err)
    }
}

const scrapeLevel=async(maxPages,queueUrl)=>{

    for(let i=1;i<=linksInDepth.length && pageCounter<=maxPages ;i++){
        await Axios.post(workerURL,{queueUrl,depthCounter})
            .then((result)=>{
                page=result?.data
        })
        if(page){
            pageCounter++;
            newLinks=[...newLinks,...page.pageLinks]
        } 
    }
    depthCounter++
}

module.exports=scrapeUrl