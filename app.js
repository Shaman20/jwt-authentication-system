require("dotenv").config()
require("./config/database").connect()
const express = require('express')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth')
const app = express()

app.use(express.json())

app.post('/welcome', auth, (req, res) => {
    res.status(200).send('Welcome 🙌')
})

app.post('/api/register', async(req, res) => {

    try {
        const {firstName, lastName, email, password} = req.body

        if (!(email && password && firstName && lastName)) {
            res.status(400).send('All input needed')
        }

        const oldUser = await User.findOne({ email })

        if (oldUser) {
            res.status(409).send('User exists. Please login!')
        }

        encryptedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: encryptedPassword
        })

        const token = jwt.sign(
            {user_id: user._id, email},
            process.env.TOKEN_KEY,
            {
                expiresIn: '2h'
            }
        )
        user.token = token

        res.status(201).json(user)
    } catch(err) {
        console.log(err)
    }
})

app.post('/api/login', async(req, res) => {

    try {

        const {email, password} = req.body
        
        if (!(email && password)) {
            res.status(400).send('All input required')
        }

        const user = await User.findOne({ email })

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({
                user_id: user._id, email
            }, process.env.TOKEN_KEY, {
                expiresIn: '2h'
            })
            user.token = token

            res.status(200).json(user)
        }
        res.status(400).send('Invalid Credentails')

    } catch (err) {
        console.log(err)
    }
})

module.exports = app
