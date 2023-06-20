const jwt = require('jsonwebtoken');
const mongooose = require('mongoose');
const bcrypt = require('bcryptjs');

const transactionSchema = new mongooose.Schema({
    senderName: {
        type: String,
        required: true
    },
    receiverName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ],
    senderAcountno: {
        type: Number,
        required: true
    },
    receiverAcountno: {
        type: Number,
        required: true
    },
    amountTransferred : {
        type: Number,
        default: 2000
    }
});

transactionSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        return token;
    } catch (err) {
        console.log(err);
    }
}

const Transaction = mongooose.model('TRANSACTION', transactionSchema);

module.exports = Transaction;