const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
    pageTitle: {
        type: String
    },
    pageUrl: {
        type: String,
        required: true,
        unique: true
    },
    nodeChildren: [{
        link: { type: String, required: true },
        node: { type: String, default: '' }
    }]
});
nodeSchema.virtual('trees', {
    ref: 'Tree',
    localField: '_id',
    foreignField: 'node'
})

const Node = mongoose.model('Node', nodeSchema);

module.exports = Node;