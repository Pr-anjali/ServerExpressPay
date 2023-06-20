const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const querySchema = mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "USER",
        required: true,
        select: 'name _id'
    },
    isResolved: {
        type: Boolean,
        required: false,
        default: false
    }
    ,
    comments: [{
        author: {
            type: Schema.Types.ObjectId,
            ref: "USER",
            required: true,
            select: 'name _id'
        },
        desc: {
            type: String,
            required: false,
        },
        votes: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: "USER",
                required: true,
                select: 'name _id'
            },
            vote: {
                type: Boolean
            }
        }]
    }],
    tag: {
        type: String,
        required: false
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('QUERY', querySchema);