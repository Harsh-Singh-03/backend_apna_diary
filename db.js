const mongoose = require('mongoose')
require('dotenv/config')
const mongoUrl = process.env.DB_URL;
const connectToMongo = ()=>{
mongoose.connect(mongoUrl, ()=>{
    console.log("connectes to mongo")
})
}

module.exports = connectToMongo;