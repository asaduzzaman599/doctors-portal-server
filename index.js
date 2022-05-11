require('dotenv').config()
const express = require('express');
const cors = require('cors');

const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ztbi4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
/* client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
}); */

(async () => {
    try {
        await client.connect()
    } finally {
        console.log("db connected")
    }
})().catch(console.dir)


app.get('/', (req, res) => {
    res.send(`Server running at port: ${port}`)
})



app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
})