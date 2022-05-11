require('dotenv').config()
const express = require('express');
const cors = require('cors');

const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send(`Server running at port: ${port}`)
})



app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
})