const mongoose = require('mongoose')
const mongoUrl = "mongodb+srv://harsh_singh:harshdata143@cluster0.e49ur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const connectToMongo = ()=>{
mongoose.connect(mongoUrl, ()=>{
    console.log("connectes to mongo")
})
}

module.exports = connectToMongo;