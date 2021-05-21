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
    isTreeComplete: {
        type: Boolean,
        default: false
    },
    treeChildren: [{
        link: { type: String, required: true },
        node: { type: mongoose.Schema.Types.ObjectId, default: {} }
    }]
});


const Tree = mongoose.model('Tree', treeSchema);

module.exports = Tree;