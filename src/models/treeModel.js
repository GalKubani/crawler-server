const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
    pageUrl: {
        type: Object,
        default: {}
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
        children:[]
    }]
});


const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree;