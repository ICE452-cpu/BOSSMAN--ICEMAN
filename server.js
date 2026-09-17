const scrypt = (password, salt) =>
  crypto.scryptSync(password, salt, 64).toString("hex");

/* ================= REGISTER ================= */

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    const db = readDB();

    const existingUsername = db.users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken."
      });
    }

    const existingEmail = db.users.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already registered."
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const user = {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash: scrypt(password, salt),
      salt,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    await notify(
      "New Store registration",
      username,
      email
    );

    res.json({
      success: true,
      message: "Account created successfully."
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});


/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required."
      });
    }

    const db = readDB();

    const user = db.users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    let ok = false;

    if (user) {
      try {
        const storedHash = Buffer.from(
          user.passwordHash,
          "hex"
        );

        const suppliedHash = Buffer.from(
          scrypt(password, user.salt),
          "hex"
        );

        if (storedHash.length === suppliedHash.length) {
          ok = crypto.timingSafeEqual(
            storedHash,
            suppliedHash
          );
        }
      } catch {
        ok = false;
      }
    }

    await notify(
      ok ? "Successful Store login" : "Failed Store login attempt",
      username,
      user?.email || "unknown"
    );

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.token = token;
    writeDB(db);

    res.json({
      success: true,
      token,
      username: user.username
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});


/* ================= GMAIL NOTIFICATION ================= */

async function notify(action, username, email) {
  try {
    const db = readDB();

    const message = {
      id: crypto.randomUUID(),
      username: username || "unknown",
      email: email || "unknown",
      action,
      time: new Date().toISOString()
    };

    db.messages.push(message);
    writeDB(db);

    const transporter = getTransporter();

    if (!transporter) {
      console.log("Gmail is not configured yet.");
      return;
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: NOTIFICATION_EMAIL,
      subject: "🔥 ICEMAN EFOOTBALL STORE - Customer Activity",
      text:
`New Store activity

Action: ${action}
Username: ${message.username}
Email: ${message.email}
Time: ${message.time}

Customer password was NOT included.`
    });

    console.log("Gmail notification sent successfully.");

  } catch (error) {
    console.error("Notification error:", error.message);
  }
      }
