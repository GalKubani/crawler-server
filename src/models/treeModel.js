const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
    pageUrl: {
        type: String,
        required: true
    },
    pageTitle: {
        type: String,
        required: true
    },
    totalPagesScraped: {
        type: Number,
        required: true
    },
    treeChildren: [{
        link:{type:String,required:true},
        node:{type:Object, default: {}}
    }]
});


const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree;