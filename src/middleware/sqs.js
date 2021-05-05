const AWS= require('aws-sdk')

const sqs=new AWS.SQS({
    apiVersion: "2012-11-05",
    region: process.env.AWS_REGION
})

const createQueue=async(req,res,next)=>{
    const QueueName=req.body.QueueName
    try{
        const data= await sqs.createQueue({
            QueueName
        }).promise();
        req.queueUrl=data.QueueUrl;
        next()
    }catch(err){
        console.log(err)
    }
}

const sendMessageToQueue= async(req,res,next)=>{
    const QueueUrl= req.queueUrl
    const MessageBody=req.body.messageBody
    try{
        const {MessageId}= await sqs.sendMessage({
            QueueUrl,
            MessageBody
        }).promise();
        req.messageId= MessageId
        next()
    }catch(err){
        console.log(err)
    }
}
const sendLinksToQueue= (links,QueueUrl)=>{
    console.log(QueueUrl)
    try{
        links.map((link)=>{
            let MessageBody=link
            sqs.sendMessage({
                QueueUrl,
                MessageBody
            }).promise();
        })
        return links.length
    }catch(err){
        console.log(err)
    }
}

const pullMessagesFromQueue= async(req,res,next)=>{
    const QueueUrl= req.query.queueUrl
    try{
        const {Messages}=await sqs.receiveMessage({
            QueueUrl,
            MaxNumberOfMessages: 10,
            MessageAttributeNames:[
                "All"
            ],
            VisibilityTimeout:30,
            WaitTimeSeconds:5
        }).promise()
        req.messages=Messages || [];
        next()

        if(Messages){
            const messagesDeleteFunc=Messages.map(message=>{
                return sqs.deleteMessage({
                    QueueUrl,
                    ReceiptHandle: message.ReceiptHandle
                }).promise()
            })
            Promise.allSettled(messagesDeleteFunc)
            .then(data=>console.log(data))
        }
    }catch(err){
        console.log(err)
    }
}
const deleteQueue = async(req,res,next)=>{
    next()
    const QueueUrl=req.body.queueUrl

    try{
        await sqs.deleteQueue({QueueUrl}).promise()
        
    }catch(err){    
        console.log(err)
    }
}
module.exports={
    createQueue,
    sendMessageToQueue,
    pullMessagesFromQueue,
    sendLinksToQueue,
    deleteQueue
}