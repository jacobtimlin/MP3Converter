const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email)
        if(user == null) {
            return done(null, false, {message: 'An account with this email does not exist'})
        }

        try{
            if(await bcrypt.compare(password, user.password)) {
                return done(null, user)
            }
            else{
                return done(null, false, {message: 'Wrong password. Please try again'})
            }
        }
        catch(e) {
            return done(e)
        }
    }

    passport.use(new localStrategy({ usernameField: 'email'}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })
}

module.exports = initialize