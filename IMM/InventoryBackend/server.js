import express from "express"
import cors from 'cors'
import 'dotenv/config'


const app =express()
const pot = process.env.PORT || 4000

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Bukas sya ya!')
})

app.listen(pot, () => {
    console.log(`Server is running on port ${pot}`)
})