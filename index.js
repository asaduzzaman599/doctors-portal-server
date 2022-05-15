require('dotenv').config()
const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())

const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization

    if (!authorization) {
        return res.status(401).send({ message: "unAuthorization" })
    }

    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "forbidden" })
        }

        req.decoded = decoded

        next()
    });
}
const { MongoClient, ServerApiVersion } = require('mongodb');
const { is } = require('express/lib/request');
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
        const isAdmin = async (email) => {
            const user = await collectionuUser.findOne({ email })
            const admin = user.role === "admin"
            return admin
        }

        app.get('/user', verifyToken, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            /* if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden' })
            } */

            const users = await collectionuUser.find().toArray()

            res.send({ success: true, users })
        })

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
            const token = jwt.sign({
                email
            }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
            res.send({ token, result })
        })

        app.put('/user/admin/:email', verifyToken, async (req, res) => {
            const userEmail = req.params.email
            const adminEmail = req.query.email
            const decodeEmail = req.decoded.email
            if (adminEmail !== decodeEmail) {
                return res.status(403).send({ message: 'forbidden' })
            }


            const filter = { email: userEmail };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }

            };
            const admin = await isAdmin(adminEmail)
            if (admin) {
                console.log('Admin', admin)

                const result = await collectionuUser.updateOne(filter, updateDoc)

                return res.send({ success: true, result })
            } else {
                res.send({ success: false })
            }
        })

        app.get('/admin', verifyToken, async (req, res) => {
            const queryEmail = req.query.email
            const decodedEmail = req.decoded.email
            if (queryEmail !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden' })
            }
            const admin = await isAdmin(queryEmail)
            res.send({ admin })
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
        app.get('/booking', verifyToken, async (req, res) => {
            const queryEmail = req.query.email
            const decodedEmail = req.decoded.email
            if (queryEmail !== decodedEmail) {
                return res.status(403).send({ message: "forbidden" })
            }
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