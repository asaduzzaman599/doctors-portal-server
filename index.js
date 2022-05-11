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


(async () => {
    try {
        await client.connect()
        console.log("db connected")

        const db = client.db("doctors_portal")
        const collectionTreatment = db.collection('treatments')
        const collectionBooked = db.collection('booked')


        app.get('/treatment', async (req, res) => {
            const cursor = collectionTreatment.find({});
            const treatment = await cursor.toArray()

            res.send(treatment)

        })

        app.post('/booked', async (req, res) => {
            const body = req.body;
            const result = await collectionBooked.insertOne(body)
            res.send(result)
        })
    } finally {
    }
})().catch(console.dir)


app.get('/', (req, res) => {
    res.send(`Server running at port: ${port}`)
})



app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
})