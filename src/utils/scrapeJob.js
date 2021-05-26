const Axios = require('axios')
const { sendLinksToQueue, deleteQueue } = require('../middleware/sqs')
const Tree = require('../models/treeModel')

let pageCounter = 0, depthCounter = 0, totalLinksSentToQueue = 0
let newLinks = [], linksInDepth = [], linksSentToQueue = []
let workersSent = 0, workersDone = 0
let requestedDepth = 0, requestedPages = 0
let currentQueueUrl, currentQueueName

let workerURL = `http://localhost:3040/start-scarping-page`

const scrapeUrl = async (url, maxDepth, maxPages, queueUrl, QueueName, currentTree) => {
    console.log("scraping- " + url, maxDepth, maxPages)
    requestedDepth = maxDepth
    requestedPages = maxPages
    currentQueueUrl = queueUrl
    currentQueueName = QueueName
    let tree = currentTree || {}
    try {
        if (!url.includes("https://")) { url = "https://" + url }
        if (!currentTree) {
            const res = await Axios.post(workerURL, { queueUrl, depthCounter, QueueName })
            if (!res.data) { return undefined }
            tree = res.data
        }
        if (maxDepth === 0) { return tree }
        for (let i = 0; i < tree.treeChildren.length; i++) { linksInDepth.push(tree.treeChildren[i].link) }
        pageCounter++
        sendLinksToSqs()
        depthCounter++
        newLinks = []
        console.log("links in depth- " + linksInDepth.length + " current depth - " + depthCounter)
        scrapeLevel(maxPages, queueUrl, QueueName, linksInDepth.length, depthCounter, tree._id)
        return tree
    } catch (err) {
        console.log(err)
    }
}

const scrapeLevel = async (maxPages, queueUrl, QueueName, totalLinks, depthCounter, treeId) => {
    let workerScrapeIndex = maxPages - pageCounter < totalLinks ? maxPages - pageCounter : totalLinks
    workersSent = Math.floor(workerScrapeIndex / 5) + 1
    console.log("sending a total of " + workersSent + " workers")
    for (let i = 0; i < workersSent; i++) {
        Axios.post(workerURL, { queueUrl, depthCounter, QueueName, treeId })
    }
}
const workerDone = async (req, res) => {
    workersDone++
    let pagesScraped = req.body.pagesScraped

    for (let j = 0; j < pagesScraped.length; j++) {
        let validPage = false
        totalLinksSentToQueue--
        pagesScraped[j]?.pageUrl ? validPage = true : "";
        for (let i = 0; i < linksInDepth.length; i++) {
            if (!validPage) {
                if (linksInDepth[i] === pagesScraped[j] + "") {
                    linksInDepth.splice(i, 1)
                    break;
                }
            }
            else {
                if (linksInDepth[i] === pagesScraped[j].pageUrl + "") {
                    pageCounter++
                    linksInDepth.splice(i, 1)
                    newLinks = [...newLinks, ...pagesScraped[j].pageLinks]
                    break;
                }
            }
        }
    }
    await Tree.findByIdAndUpdate({ _id: req.body.treeId }, { totalPagesScraped: pageCounter }, {
        new: true,
        runValidators: true,
    });
    console.log("active workers remaining- " + (workersSent - workersDone))
    console.log("total pages scraped- " + pageCounter)
    console.log("links sent to queue remaining-" + totalLinksSentToQueue)
    console.log("total links in current depth- " + linksInDepth.length)
    if (totalLinksSentToQueue <= 0 && workersDone === workersSent) {
        if (linksInDepth.length === 0) {
            console.log("entering next depth- " + depthCounter)
            depthCounter++
            linksInDepth = [...newLinks]
        }
        checkAndAssignWorkers(req.body.treeId)
    }
    else if (workersDone === workersSent) {
        workersDone = 0
        scrapeLevel(requestedPages, currentQueueUrl, currentQueueName, linksInDepth.length, depthCounter, req.body.treeId)
    }
    res.send("ok")
}

const checkAndAssignWorkers = async (treeId) => {
    if (pageCounter >= requestedPages || depthCounter > requestedDepth) {
        try {
            console.log("deleting queue")
            deleteQueue(currentQueueUrl)
            resetServer()
            return
        } catch (err) { console.log(err) }
    }
    workersDone = 0
    sendLinksToSqs()
    scrapeLevel(requestedPages, currentQueueUrl, currentQueueName, totalLinksSentToQueue, depthCounter, treeId)
}
const sendLinksToSqs = () => {
    totalLinksSentToQueue = linksInDepth.length
    if (linksInDepth.length > requestedPages - pageCounter) {
        linksSentToQueue = linksInDepth.splice(0, requestedPages - pageCounter)
        totalLinksSentToQueue = linksSentToQueue.length
        linksInDepth = [...linksInDepth, ...linksSentToQueue]
        sendLinksToQueue(linksSentToQueue, currentQueueUrl)
    }
    else { sendLinksToQueue(linksInDepth, currentQueueUrl) }
}

const resetServer = () => {
    pageCounter = 0, depthCounter = 0
    newLinks = [], linksInDepth = []
    workersSent = 0, workersDone = 0
}
module.exports = { workerDone, scrapeUrl }