const Axios=require('axios')
const { sendLinksToQueue } = require('../middleware/sqs')

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
        const res=await Axios.post(workerURL,{queueUrl,depthCounter})
        page=res.data
        linksInDepth=[...page.pageLinks]
        sendLinksToQueue(linksInDepth,queueUrl)
        pageCounter++
        depthCounter++
        while(depthCounter<=maxDepth && pageCounter<=maxPages){
            newLinks=[]

            await scrapeLevel(maxPages,queueUrl)
            linksInDepth=[...newLinks]
            console.log("sending next depth to sqs")
            sendLinksToQueue(linksInDepth,queueUrl)
        }
        return page
    }catch(err){
        console.log(err)
    }
}

const scrapeLevel=async(maxPages,queueUrl)=>{

    for(let i=1;i<=linksInDepth.length && pageCounter<=maxPages ;i++){
        // nn to make this work with several workers
        // the axios request should be without await
        // the page count must wait for the result so it wont send
        // more workers than needed, to make sure request stops on max
        await Axios.post(workerURL,{queueUrl,depthCounter})
            .then((result)=>{
                page=result?.data
        })
        if(page){
            pageCounter++;
            newLinks=[...newLinks,...page.pageLinks]
        } 
    }
    console.log("finished current depth")
    depthCounter++
}

module.exports=scrapeUrl