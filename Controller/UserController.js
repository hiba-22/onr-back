
const UserModel = require("../Model/UserModel");
const createError = require("http-errors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const JWTGenerator = require("../Utils/JWTGenerator");
const sendMail1 = require('./sendMail');
const { OAuth2Client } = require('google-auth-library');
const { bucket } = require("../Firebase/firebaseConfig");
const crypto = require('crypto');
const PendingUserModel = require('../Model/PendingUserModel');
const nodemailer = require('nodemailer');



const client = new OAuth2Client(process.env.MAILING_SERVICE_CLIENT_ID);
const {CLIENT_URL} = process.env


const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
}


// Méthode pour gérer l'upload du CV
exports.uploadResume = async (req, res, next) => {
    try {
        const file = req.file; // Fichier téléchargé
        const userId = req.body.userId; // ID de l'utilisateur auquel associer le CV

        if (!file) {
            return res.status(400).json({ error: "No file uploaded." });
        }

        const blob = bucket.file(`resumes/${Date.now()}_${file.originalname}`); // Créer un nouveau fichier dans Firebase Storage
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on("error", (err) => {
            console.error("Blob stream error:", err);
            res.status(500).json({ error: "Something went wrong with the upload." });
        });

        blobStream.on("finish", async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // URL publique du fichier

            // Mettre à jour l'utilisateur avec l'URL du CV
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }
            user.resume = publicUrl;
            await user.save();

            res.status(200).json({ message: "Resume uploaded successfully.", url: publicUrl });
        });

        blobStream.end(file.buffer); // Écrire le contenu du fichier dans Firebase Storage
    } catch (error) {
        console.error("Error uploading resume:", error);
        res.status(500).json({ error: "An error occurred during the upload." });
    }
};
/*exports.updateUser = async (req, res, next) => {
    const data = req.body;
    try {
        if (req?.user?.email !== data?.email) {
            next(createError(500, `You have no permission to update`));
        } else {
            const updateUser = await UserModel.updateOne(
                { _id: req.user._id },
                { $set: data }
            );

            if (req.file) {
                const file = req.file;

                const blob = bucket.file(`resumes/${Date.now()}_${file.originalname}`);
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                blobStream.on("error", (err) => {
                    console.error("Blob stream error:", err);
                    res.status(500).json({ error: "Something went wrong with the upload." });
                });

                blobStream.on("finish", async () => {
                    // Make the file publicly accessible
                    await blob.makePublic();

                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // Public URL of the file

                    // Update the user with the resume URL
                    const user = await UserModel.findById(req.user._id);
                    user.resume = publicUrl;
                    

                    res.status(200).json({
                        status: true,
                        message: "Profile Updated",
                        result: user,
                    });
                });

                blobStream.end(file.buffer); // Write the file content to Firebase Storage
            } else {
                if (updateUser.nModified > 0) {
                    const updatedUser = await UserModel.findById(req.user._id).select("-password");
                    res.status(200).json({
                        status: true,
                        message: "Profile Updated",
                        result: updatedUser,
                    });
                } else {
                    res.status(200).json({
                        status: false,
                        message: "No changes were made",
                        result: null,
                    });
                }
            }
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};
*/
exports.updateUser = async (req, res, next) => {
    const data = req.body;
    try {
        if (req?.user?.email !== data?.email) {
            next(createError(500, `You have no permission to update`));
        } else {
            if (req.file) {
                const file = req.file;
                const blob = bucket.file(`resumes/${Date.now()}_${file.originalname}`); // Créer un nouveau fichier dans Firebase Storage
                const blobStream = blob.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                blobStream.on("error", (err) => {
                    console.error("Blob stream error:", err);
                    res.status(500).json({ error: "Something went wrong with the upload." });
                });

                blobStream.on("finish", async () => {
                    // Rendre le fichier public
                    await blob.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`; // URL publique du fichier

                    // Mettre à jour l'utilisateur avec l'URL du CV
                    const updatedUser = await UserModel.findByIdAndUpdate(
                        req.user._id,
                        { $set: { resume: publicUrl } },
                        { new: true, select: "-password" }
                    );

                    res.status(200).json({
                        status: true,
                        message: "Profile Updated",
                        result: updatedUser,
                    });
                });

                blobStream.end(file.buffer); // Écrire le contenu du fichier dans Firebase Storage
            } else {
                const updateUser = await UserModel.updateOne(
                    { _id: req.user._id },
                    { $set: data }
                );

                if (updateUser.nModified > 0) {
                    const updatedUser = await UserModel.findById(req.user._id).select("-password");
                    res.status(200).json({
                        status: true,
                        message: "Profile Updated",
                        result: updatedUser,
                    });
                } else {
                    res.status(200).json({
                        status: false,
                        message: "No changes were made",
                        result: null,
                    });
                }
            }
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};


exports.getAllUser = async (req, res, next) => {
    try {
        const result = await UserModel.find({}).select("-password");
        if (result.length !== 0) {
            res.status(200).json({
                status: true,
                result,
            });
        } else {
            next(createError(200, "User list is empty"));
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const me = req.user;
        if (!me) {
            next(createError(500, "Please login first"));
        } else {
            res.status(200).json({
                status: true,
                result: me,
            });
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.logOut = async (req, res, next) => {
    try {
        res.cookie(process.env.COOKIE_NAME, "", {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            expires: new Date(0), // Fixer une date dans le passé
            path: "/", // Assurez-vous que cela correspond au path défini lors de login
        })
            .status(200)
            .json({
                status: true,
                message: "Logout done",
            });
    } catch (error) {
        next(createError(500, error.message));
    }
};

exports.getSingleUser = async (req, res, next) => {
    res.send("get single user");
};

exports.addUser = async (req, res, next) => {
    const data = req.body;
    try {
        const isUserExists = await PendingUserModel.findOne({ email: data.email });
        if (isUserExists) {
            return next(createError(500, "Email Already exists"));
        } else {
            const isFirstUser = (await UserModel.countDocuments()) === 0;
            data.role = isFirstUser ? "admin" : "user";

            // Create a verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const newPendingUser = new PendingUserModel({
                ...data,
                verificationToken
            });
            await newPendingUser.save();  // Save user in the pending collection

            // Send verification email
            const transporter = nodemailer.createTransport({
                service: 'gmail', // ou un autre service
                auth: {
                    user: 'hibarassas12l@gmail.com',
                    pass: 'tzhr rgbj llhl moop'
                }
            });

            const mailOptions = {
                from: 'hibarassas12l@gmail.com',
                to: data.email,
                subject: 'Account Verification',
                text: `Please verify your account by clicking the link: http://localhost:5174/activate/${verificationToken}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return next(createError(500, "Failed to send verification email"));
                }
            });

            res.status(200).json({
                status: true,
                message: "Registered Successfully. Please verify your email."
            });
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};
exports.verifyEmail = async (req, res, next) => {
    const { token } = req.params;
    console.log(`Received token: ${token}`); // Debugging
    try {
        const pendingUser = await PendingUserModel.findOne({ verificationToken: token });
        if (!pendingUser) {
            console.log('Invalid or expired token'); // Debugging
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Transfer to the main user collection with isVerified: true
        const newUser = new UserModel({
            username: pendingUser.username,
            email: pendingUser.email,
            password: pendingUser.password,
            location: pendingUser.location,
            gender: pendingUser.gender,
            role: pendingUser.role,
            resume: pendingUser.resume,
            isVerified: true // Set isVerified to true
        });

        await newUser.save(); // Save user in the main collection

        // Remove from pending collection
        await PendingUserModel.deleteOne({ verificationToken: token });

        console.log('Email verified and user activated'); // Debugging
        res.status(200).json({ message: 'Email verified successfully. Your account is now active.' });
    } catch (error) {
        console.error('Error during verification:', error); // Debugging
        next(createError(500, error.message));
    }
};


/*exports.addUser = async (req, res, next) => {
    const {username, email, password} = req.body;
    try {
        const isUserExists = await UserModel.findOne({ email});
        if (isUserExists) {
            next(createError(500, "Email Already exists"));
        } else {
            const isFirstUser = (await UserModel.countDocuments()) === 0;
            req.body.role = isFirstUser ? "admin" : "user";
            const newUser = {username, email, password};
            
            const activation_token = JWTGenerator(newUser, "5m");
            const url = `${CLIENT_URL}/auth/activate/${activation_token}`
            sendMail(email, url, "Verify your email address")
            
            res.status(200).json({
                status: true,
                message: "Registered Successfully! Please activate your email to start.",
              
            });
        }
    } catch (error) {
        next(createError(500, error.message));
    }
};
exports.activateEmail = async (req, res) => {
    try {
        const { activation_token } = req.body;
        const user = jwt.verify(activation_token, process.env.JWT_SECRET);
        console.log(user);
        const { username, email, password } = user;

        const check = await UserModel.findOne({ email });
        if (check) return res.status(400).json({ msg: "This email already exists." });

        const newUser = new UserModel({
            username, email, password
        });

        await newUser.save();

        res.json({ msg: "Account has been activated!" });

    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};*/
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const isUserExists = await UserModel.findOne({ email });
        if (isUserExists) {
            const isPasswordMatched = await bcrypt.compare(
                password,
                isUserExists.password
            );
            if (isPasswordMatched) {
                const tokenObj = {
                    ID: isUserExists._id,
                    role: isUserExists.role,
                };
                const TOKEN = JWTGenerator(tokenObj);

                const one_day = 1000 * 60 * 60 * 24; //puisque le token expire dans 1 jour

                res.cookie(process.env.COOKIE_NAME, TOKEN, {
                    expires: new Date(Date.now() + one_day),
                    secure: true, // Envoyé uniquement par HTTPS
                    httpOnly: true, // Restreint l'accès des scripts côté client
                    signed: true, // Aide à sécuriser le cookie
                    sameSite: "None",
                });
                res.status(200).json({
                    status: true,
                    message: "Login Successfully",
                });
            } else {
                next(createError(500, "Email or Password not matched"));
            }
        } else {
            next(createError(500, "User not found!!!"));
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const {tokenId} = req.body

        const verify = await client.verifyIdToken({idToken: tokenId, audience: process.env.MAILING_SERVICE_CLIENT_ID})
        console.log(verify);
        
       const {email_verified, email,name} = verify.payload

        const password = email + process.env.GOOGLE_SECRET

       // const passwordHash = await bcrypt.hash(password, 12)
       //console.log(email_verified);
        if(!email_verified) return res.status(400).json({msg: "Email verification failed."})

        const user = await UserModel.findOne({email})

        if(user){
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({msg: "Password is incorrect."})
            const tokenObj = {
                ID: user._id,
                role: user.role,
            };
           
            const refresh_token = JWTGenerator(tokenObj);
            const one_day = 1000 * 60 * 60 * 24; 
            res.cookie(process.env.COOKIE_NAME, refresh_token, {
                expires: new Date(Date.now() + one_day),
                secure: true, // Envoyé uniquement par HTTPS
                httpOnly: true, // Restreint l'accès des scripts côté client
                signed: true, // Aide à sécuriser le cookie
                sameSite: "None",
            });
            /*res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
               // path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7 days
            })*/

            res.json({msg: "Login success!"})
        }else{
            const newUser = new UserModel({
                username : name, email, password
            })

            await newUser.save()
            
            const refresh_token = JWTGenerator({ID: newUser._id,role: newUser.role,})
            const one_day = 1000 * 60 * 60 * 24; 
            res.cookie(process.env.COOKIE_NAME, refresh_token, {
                expires: new Date(Date.now() + one_day),
                secure: true, // Envoyé uniquement par HTTPS
                httpOnly: true, // Restreint l'accès des scripts côté client
                signed: true, // Aide à sécuriser le cookie
                sameSite: "None",
            });
           /* res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                // path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 // 7 days
            })*/

            res.json({msg: "Login success!"})
        }


    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return next(createError(404, "User not found"));
        }

        const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hibarassas12l@gmail.com',
                pass: 'tzhr rgbj llhl moop'
            }
        });

        const mailOptions = {
            from: 'hibarassas12l@gmail.com',
            to: user.email,
            subject: 'Password Reset',
            text: `Please reset your password by clicking the link: http://localhost:5174/reset/${user._id}/${resetToken}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return next(createError(500, "Failed to send reset email"));
            }else {
                console.log("Email sent: " + info.response);
            }
        });

        res.status(200).json({
            status: true,
            message: "Password reset email sent"
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};
exports.resetPassword = async (req, res, next) => {
    const { id,token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return next(createError(404, "User not found"));
        }
      
       // Hachage du mot de passe
       const salt = await bcrypt.genSalt(16);
       const hashedPassword = await bcrypt.hash(password, salt);

       await UserModel.findByIdAndUpdate(id, { password: hashedPassword });

        res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};

/*exports.resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email } = decoded;

        const user = await UserModel.findOne({ email });
        if (!user) {
            return next(createError(404, "User not found"));
        }

      //  const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};
/**exports.forgotPassword = async (req, res) => {
    try {
        const {email} = req.body
        const user = await UserModel.findOne({email})
        if(!user) return res.status(400).json({msg: "This email does not exist."})
        
        const access_token = createAccessToken({id: user._id})
        const url = `${CLIENT_URL}/reset/${access_token}`

        sendMail1(email, url, "Reset your password")
        res.json({msg: "Re-send the password, please check your email."})
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},
exports.resetPassword = async (req, res) => {
    try {
        const {password} = req.body
    
        const passwordHash = await bcrypt.hash(password, 12)

        await UserModel.findOneAndUpdate({_id: req.user.id}, {
            password: passwordHash
        })
        
        res.json({msg: "Password successfully changed!"})
    } catch (err) {
        return res.status(500).json({msg: err.message})
    }
},
*/
/*exports.updateUser = async (req, res, next) => {
    const data = req.body;
    try {
        if (req?.user?.email !== data?.email) {
            next(createError(500, `You have no permission to update`));
        } else {
            const updateUser = await UserModel.updateOne(
                { _id: req.user._id },
                { $set: data }
            );

            if (updateUser.nModified > 0) {
                const updatedUser = await UserModel.findById(
                    req.user._id
                ).select("-password");
                res.status(200).json({
                    status: true,
                    message: "Profile Updated",
                    result: updatedUser,
                });
            } else {
                res.status(200).json({
                    status: false,
                    message: "No changes were made",
                    result: null,
                });
            }
        }
    } catch (error) {
        next(createError(500, `Something went wrong: ${error.message}`));
    }
};
*/
exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            next(createError(400, "Invalid User ID format"));
        }

        const isUserExists = await UserModel.findOne({ _id: id });
        if (!isUserExists) {
            res.status(500).json({
                status: false,
                message: "User not found",
            });
        } else {
            const result = await UserModel.findByIdAndDelete(id);
            res.status(200).json({
                status: true,
                message: "User Deleted",
            });
        }
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

exports.deleteAllUser = async (req, res, next) => {
    try {
        result = await UserModel.deleteMany({});
        res.status(201).json({
            status: true,
            message: "All userd deleted",
        });
    } catch (error) {
        next(createError(500, `something wrong: ${error.message}`));
    }
};

/*exports.addGuestUser = async (req, res, next) => {
    const { username, email } = req.body;
    const resume = req.file; // Assurez-vous que le middleware multer est configuré pour gérer les fichiers

    try {
        const isUserExists = await UserModel.findOne({ email });
        if (isUserExists) {
            return res.status(500).json({
                status: false,
                message: "Email already exists",
            });
        }

        const password = 'passwordGuest';
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new UserModel({
            username: username,
            email,
            password: hashedPassword,
            role: 'guest',
            resume: resume.path // Stocke le chemin du fichier
        });

        const savedUser = await newUser.save();

        res.status(200).json({
            status: true,
            message: "Guest user added successfully!",
            userId: savedUser._id, // Retourne l'ID de l'utilisateur invité ajouté
        });
    } catch (error) {
        next(createError(500, error.message));
    }
};*/



