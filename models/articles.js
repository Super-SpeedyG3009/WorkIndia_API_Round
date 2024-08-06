const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    category: {
        type: String, 
        required: true,
    },
    title: {
        type: String, 
        required: true, 
    },
    author: {
        type: mongoose.Schema.Types.ObjectId, // Use ObjectId to reference User model
        ref: 'User', // Reference the User model
        required: true,
    },
    content: {
        type: String, 
        required: true, 
    },
    link: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true, 
    },
    net_votes: {
        type: Number,
        required: true,
        default: 0,
    },
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;