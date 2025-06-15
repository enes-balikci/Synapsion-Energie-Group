const express = require("express");
const helmet = require("helmet");
const saml = require("passport-saml").Strategy; // SSO için
const verifyRecaptcha = require("./recaptcha-middleware"); // Kendi yazacağın middleware
const app = express();

app.use(helmet());
app.use(verifyRecaptcha); // Giriş endpointinde reCAPTCHA doğrulaması
app.get('/auth/saml', (req, res) => { /* SAML/OIDC entegrasyonu */ });
