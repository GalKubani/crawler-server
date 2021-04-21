const cheerio=require('cheerio')
const Axios=require('axios')
const {Worker}=require('worker_threads')
const redisClient=require('../db/redis')

let pageCounter=0
let depthCounter=0
let linksInDepth=[]
let newLinks=[]

const scrapeUrl=async (url,maxDepth,maxPages)=>{
    console.log("scraping"- url, maxDepth,maxPages)
    try{
        if(!url.includes("https://")) { url="https://"+url }
        let page={}
        const res=await Axios.get(url)

        if(res.status===200){            
            page=scrapePage(res.data,url)
            linksInDepth=[...page.pageLinks]
            console.log(linksInDepth)
            pageCounter++
        }
        depthCounter++
        while(depthCounter<=maxDepth && pageCounter<=maxPages){
            newLinks=[]
            
            console.log(linksInDepth)
            console.log("current depth ",depthCounter)
            console.log("current page count ",pageCounter)
            await scrapeLevel(maxPages)
            linksInDepth=[...newLinks]
        }
        return page
    }catch(err){
        console.log(err)
    }
}
const scrapeLevel=async(maxPages)=>{
    const scarpedPages=[]
    console.log(linksInDepth.length)
    for(let i=1;i<=linksInDepth.length && pageCounter<=maxPages ;i++){
        let res
        try{
            res= await Axios.get(linksInDepth[i-1])
        }catch(err){
            continue;
        }
        if(res.status===200){
            page=scrapePage(res.data,linksInDepth[i-1])
            if(page){
                scarpedPages.push(page)
                pageCounter++;
            } 
        }
    }
    depthCounter++
    // nn to check if max depth, if not continue scraping

}
const scrapePage=(pageData,url)=>{
    const $= cheerio.load(pageData);  
    let pageLinks=[]
    $('a').each((i,el)=>{
        const link= $(el).attr('href')
        if(link?.includes(`https://`)){
            pageLinks.push(link)
        }    
    })
    const pageUrl=url;
    const pageTitle=$('title').text()
    page={
        pageTitle,
        pageDepth:depthCounter,
        pageUrl,
        pageLinks
    }
    newLinks=[...newLinks,...pageLinks]
    try{    
        redisClient.setexAsync(
            "Scraped page: "+pageTitle,
            300,
            JSON.stringify(page)
        )
    }catch(err){
        console.log(err)
        return undefined
    }
    return page
}
module.exports=scrapeUrl