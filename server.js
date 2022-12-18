//setting the user id
iduser = Date.now().toString();

//setting packages and port number
if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const fetch = require("node-fetch");
const app = express();
const port = 3000;
var mysql = require('mysql2');

const pool = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"i*SAB2MS2002LOZ",
    database:"mp3converterdb",
    connectionLimit:10
});

//set ejs
app.set('view-engine', 'ejs');

app.get('/account', function(reg, res){
    pool.query(`select * from user where iduser = ${iduser}`, (err,rows)=>{
        if(err)throw console.err("An error occured loading table.");

        if(!err){
            res.render('account.ejs', {rows})
        }
    });
});



const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const users=[];

const createPassport = require('./passportConfig');
const { name } = require('ejs');
createPassport(
    passport,
    email =>users.find(user =>user.email === email),
    id => users.find(user => user.id === id)
);

app.set('view-engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(flash())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

//lets the program access frontend
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('*_method'));
app.use(express.static('public'));
app.use('/css',express.static(__dirname + 'public/CSS'));
app.use('/js',express.static(__dirname + 'public/JS'));
app.use('/txt',express.static(__dirname + 'public/JS'));

app.get('/', (req, res) => {
    res.render('index.ejs')
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.get('/login', (req, res) => {
    res.render('login.ejs')
});

app.get('/account', (req, res)=> {
    res.render('account.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.post("/convert", async (req, res) =>{
    const tag = req.body.tag
    if(tag === undefined || tag === "" || tag === null){
        return res.render("index.ejs", {converted:false, error: "Invalid video tag. Please check and make sure you entered a valid video tag."});
    }else{
        const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${tag}`,{
            "method" : "GET",
            "headers": {
                "x-rapidapi-key" : process.env.API_KEY,
                "x-rapidapi-host" : process.env.API_HOST
            }
        });

        const fetchResponse = await fetchAPI.json();

        if(fetchResponse.status === "ok")
            return res.render("index.ejs", {converted : true, title : fetchResponse.title, link : fetchResponse.link});
        else
            return res.render("index.ejs", {converted : false, error : fetchResponse.msg})
    }
});

app.get('/register', (req, res) => {
    res.render('register.ejs')
});
//adding users to system
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 8)
        users.push({
            id: iduser,
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword

            
        });
        pool.getConnection(function(err){
            username=req.body.name,
            email= req.body.email,
            password= hashedPassword
            if(err) throw console.err("Error occured while inserting into.");
            console.log("Connected to MySQL..");
            var sql = "INSERT INTO user (iduser, Username, email, password) VALUES (?, ?, ?, ?)";
            pool.query(sql, [iduser, username, email, password], function(err, res){
                if(err) throw err;
                console.log("1 user inserted.");
            });
        });
        
        //sends user to login page
        res.redirect('/login')
    }
    catch{
        res.redirect('/register')
    }
    console.log(users)
});

//verification
function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/login')
}

//checks if not verified
function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}