// mongodb+srv://harsh_singh:<password>@cluster0.e49ur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority

const connectToMongo =require('./db')
const express = require('express')
var cors = require('cors')

connectToMongo();
const app = express()
const port = process.env.PORT || 8000

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello harsh!')
})
app.use(express.json())
app.use("/api/auth", require('./routes/auth'))
app.use("/api/notes", require('./routes/notes'))

app.listen(port, () => {
  console.log(`InoteBook backend listening on port http://localhost:${port}`)
})