const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

//Load input validation
const validateRegisterInput = require('../../validation/signup');
const validateLoginInput = require('../../validation/login');

//Load User Model
const User = require('../../models/Users');



// @ Route Get api/users/signUp
// @desc Register user
// @access Public
router.post('/signup', (req, res) => {

    const {errors, isValid } = validateRegisterInput(req.body);

    // check validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email : req.body.email })
    .then(user => {
        if(user) {
            errors.email = "Email already Exists";
            return res.status(400).json(errors);
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm' // Default
            });

            const newUser = new User ({
                first_name : req.body.first_name,
                last_name : req.body.last_name,
                user_name : req.body.user_name,
                email : req.body.email,
                password: req.body.password,
                address : req.body.address,
                phone : req.body.phone,
                avatar
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                  if(err) throw err;
                  newUser.password = hash;
                  newUser.save()
                    .then(user => res.json(user))
                    .catch(err => console.log(err)); 
                });
            });
        }
    });
});

// @ Route Get api/users/login
// @desc login user / returning jwt token
// @access Public

router.post('/login', (req, res) => {

    const {errors, isValid } = validateLoginInput(req.body);

    // check validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({email})
        .then(user => {
            // check for user
            if(!user) {
                errors.email = "User not Found"
                return res.status(404).json(errors);
            }

            //check Password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch) {
                        // User Match
                        const payload = { id: user.id, name: user.name, avatar: user.avatar} // create jwt payload
                        // sign Token
                        jwt.sign( payload, keys.secretOrKey, { expiresIn: 3600 }, (err, token) => {
                            res.json({
                                success: true,
                                token: 'Bearer ' + token
                            });
                        } );
                    } else {
                        errors.password = "Password is Incorrect";
                        return res.status(400).json(errors);
                    }
                });
        });
});

// @ Route Get api/users/current
// @desc return current user
// @access Private

router.get('/current', passport.authenticate('jwt', { session : false }), (req, res )=> {
    res.json({
        id : req.user.id,
        user_name: req.user.user_name,
        email : req.user.email
    });
});
module.exports = router;