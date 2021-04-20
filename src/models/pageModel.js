const mongoose= require('mongoose')

const pageSchema= new mongoose.Schema({
    pageTitle:{type: String,required:true,trim:true},
    pageDepth:{type: Number,required:true},
    pageUrl:{type: String,required:true,trim:true},
    pageLinks:[
        {link: {type:String,trim:true}}
    ]
    
});

const Page= mongoose.model('Page',pageSchema);
module.exports=Page