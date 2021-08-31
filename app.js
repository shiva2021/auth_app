const express = require("express")
const app = express()
const {
	json,
	urlencoded
} = require("body-parser");
const Sessions = require("express-session")
const MongoStore = require("connect-mongo")
const mongoose = require("mongoose")
let port = 3000;
let dbUri = "mongodb://127.0.0.1:27017/auth-app"
const UserModel = require('./models/User')
const bcrypt = require('bcryptjs')

main().then(() => console.log('MongoDb has connected!')).catch(err => console.log(err));

async function main() {
	await mongoose.connect(dbUri)
}



const store = MongoStore.create({
	mongoUrl: dbUri,
	dbName: "mySessions"
})

app.use(json())
app.use(urlencoded({
	extended: true
}))

app.use(Sessions({
	cookie: {
		secure: false
	},
	secret: 'ThisIsMyDamnSecretKey.....shhhhhhhh',
	resave: false,
	saveUninitialized: true,
	store
}))


const checkAuth = (req, res, next) => {
	if (req.session.isAuth) {
		next()
	} else {
		throw 'User not authorized'
	}
}

app.get("/", async function (req, res) {
	try {
		debugger;
		res.send({
			msg: 'Hurray, your app is ready!',
			session: req.session
		})
	} catch (error) {
		console.log(error)
	}
})


app.post("/login", async function (req, res) {
	try {
		let {
			email,
			password
		} = req.body

		let user = await UserModel.findOne({
			email
		})
		if (!user) {
			return res.send('user not found')
		}
		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) return res.send("incorrect password... try again!")

		req.session.isAuth = true;
		res.send("User session is now active")

	} catch (error) {
		console.log(error)
	}
})


app.get('/dashboard', checkAuth, (req, res) => {
	try {
		res.send("Hurray, the auth-app works like charm")
	} catch (e) {
		console.log(e.message)
		res.send(e)
	}
})


app.get('/logout', async (req, res)=>{
	try {
		req.session.destroy((e)=>{
			if(e) return res.send({msg: "Error occured while logging out.", e})
			res.send('User has logged out')
		})
	} catch (error) {
		console.log(error)
	}
})

app.post('/register', async (req, res) => {
	try {
		const {
			username,
			password,
			email
		} = req.body;
		let hashedPassword = await bcrypt.hash(password, 12)
		let user = await UserModel.findOne({
			email
		})
		if (!user) {
			user = new UserModel({
				username,
				password: hashedPassword,
				email
			})

			await user.save()

			res.send('User has been registered!')
		} else {
			res.send('The user already exists')
		}
	} catch (e) {
		console.log(e);
		res.send(e)
	}
})


app.listen(port, () => {
	console.log(`Your app is running on port ${port}`)
})