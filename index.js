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
        const collectionuUser = db.collection('users')


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            console.log(email)
            const filter = { email: email };
            const updateDoc = {
                $set: user

            };
            const option = { upsert: true }
            const result = await collectionuUser.updateOne(filter, updateDoc, option)
            res.send(result)
        })
        app.get('/treatment', async (req, res) => {
            const date = req.query.date || "May 14, 2022";

            const treatments = await collectionTreatment.find().toArray()
            const booked = await collectionBooked.find({ formattedDate: date }).toArray()

            treatments.forEach(treatment => {

                const bookedAppointments = booked.filter(treatmentsTreatment => treatmentsTreatment.treatmentName === treatment.name)

                const bookedSlots = bookedAppointments.map(a => a.slot)
                const available = treatment.slots.filter(slot => !bookedSlots.includes(slot))
                treatment.bookedSlots = bookedSlots

                treatment.slots = available

            })

            res.send(treatments)
            // res.send(treatment)

        })
        app.get('/booking', async (req, res) => {
            const queryEmail = req.query.email
            const query = {
                email: queryEmail
            }

            const appointments = await collectionBooked.find(query).toArray()

            res.send({ success: true, appointments })
        })

        app.post('/booking', async (req, res) => {
            const body = req.body;
            const query = {
                treatmentName: body.treatmentName,
                formattedDate: body.formattedDate,
                email: body.email
            }

            const exists = await collectionBooked.findOne(query)

            if (exists) {
                return res.send({ success: false, message: `Appointment for ${body.treatmentName} on ${body.formattedDate} already booked` })
            }
            const appointment = await collectionBooked.insertOne(body)
            res.send({ success: true, appointment })
        })
    } finally {
    }
})().catch(console.dir)


app.get('/', (req, res) => {
    res.send(`Server running at port: ${port} `)
})



app.listen(port, () => {
    console.log(`Server running at port: ${port} `)
})