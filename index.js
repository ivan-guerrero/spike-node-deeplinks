// dotenv for loading of the email user and password
require("dotenv").config();
const express = require("express");
// firebase's SDK
const admin = require("firebase-admin");
// used for sending emails
const nodemailer = require("nodemailer");
// for url parsing purposes
const url = require("url");

const app = express();
const port = 3000;

// parse JSON requests and place the result in app.body property
app.use(express.json());

// initializing firebase's SDK
// the env var GOOGLE_APPLICATION_CREDENTIALS contains the path to the file
// that contains the service account key
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// comment this if you want to use a custom smtp solution
let transporter;
nodemailer.createTestAccount().then((testAccount) => {
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
});

// comment this if you want to use the testing solution above
// // configure a reusable transporter for my personal gmail account
// // here should go the custom SMTP server config
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.user,
//     pass: process.env.password,
//   },
// });

// custom function for sending the password reset email
function sendCustomPasswordResetEmail(email, htmlMessage) {
  // use the transporter
  return transporter.sendMail({
    from: "ivancarajito@gmail.com",
    to: email,
    html: htmlMessage,
  });
}

app.post("/reset-password", (req, res) => {
  // expecting a body of { "email": "some email"}
  const userEmail = req.body.email;
  admin
    .auth()
    .generatePasswordResetLink(userEmail)
    .then((link) => {
      const queryParams = new url.URL(link).search;
      const customSchemeLink =
        "qrpass://app/open-app/remember-password" + queryParams;
      const htmlMessage = `
        <h2>Hola, usa el siguiente enlace para recuperar tu password</h2>
        <a href="${customSchemeLink}">Clíc aquí</a>
        `;
      sendCustomPasswordResetEmail(userEmail, htmlMessage).then(
        (info) => {
          console.log("mail url:", nodemailer.getTestMessageUrl(info));
          res.status(200).json({ message: "mail sent!" });
        },
        (error) => {
          console.log("error", error);
          res
            .status(500)
            .json({ message: "there was an error sending the recovery mail" });
        }
      );
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).json({ message: "there was an error with the email" });
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
