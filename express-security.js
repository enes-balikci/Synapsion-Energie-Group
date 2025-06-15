const helmet = require("helmet");
const csurf = require("csurf");
const jwt = require("jsonwebtoken");

// Express app...
app.use(helmet({
  contentSecurityPolicy: { useDefaults: true },
  referrerPolicy: { policy: "no-referrer" },
  frameguard: { action: "deny" }
}));
app.use(csurf());

// JWT auth örneği
app.post("/api/secure-login", (req, res) => {
  // ...do user/password check...
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.cookie("jwt", token, { httpOnly: true, secure: true, sameSite: "Strict" });
  res.json({ mfaRequired: true });
});
