const redisClient = require('../db/redis');
const Node = require('../models/nodeModel');
const Tree = require('../models/treeModel');

let allNodes = []
let redisKeys = []
let currentDepth = 0, totalPagesFetched = 0

const getPagesFromRedis = async (req, res) => {
    try {
        let tree = await Tree.findById(req.query.treeId)
        if (!tree) {
            throw new Error("no tree found")
        }
        redisKeys.push([])
        for (let node of tree.treeChildren) {
            if (!node) { continue }
            redisKeys[currentDepth].push("Scraped page - " + node.link)
            totalPagesFetched++
            allNodes.push(node.node)
        }
        currentDepth++
        let nodesInDepth = [...allNodes]
        while (tree.totalPagesScraped > totalPagesFetched) {
            redisKeys.push([])
            nodesInDepth = await scanNodesInDepth(nodesInDepth, tree.totalPagesScraped)
            currentDepth++
            allNodes = [...allNodes, ...nodesInDepth]
        }
        let pages = []
        for (let i = 0; i < currentDepth; i++) {
            pages.push([])
            for (let key of redisKeys[i]) {
                let page = await redisClient.getAsync(key)

                if (page) { pages[i].push(JSON.parse(page)) }
            }
        }
        allNodes = []
        redisKeys = []
        currentDepth = 0
        totalPagesFetched = 0
        if (pages) { res.send(pages); }
        else res.send([])
    } catch (err) { console.log(err); }
};
const scanNodesInDepth = async (nodes, totalPagesScraped) => {

    let nextDepthNodes = []
    let treeDone = false
    for (let node of nodes) {
        if (!node) { continue }
        let currentNode = await Node.findById(node)
        if (currentNode) {
            for (let child of currentNode.nodeChildren) {
                if (allNodes.includes(child.node)) { continue }
                redisKeys[currentDepth].push("Scraped page - " + child.link)
                totalPagesFetched++
                nextDepthNodes.push(child.node)
                if (totalPagesScraped === totalPagesFetched) {
                    treeDone = true
                    break
                }
            }
        }
        if (treeDone) { break }
    }
    return nextDepthNodes
}

module.exports = {
    getPagesFromRedis
};