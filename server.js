const express = require('express');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;


// تنظیمات میدلور
app.use(express.json());
app.use(express.static(path.join(__dirname))); // ارائه فایل‌های استاتیک
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // در تولید باید secure: true باشد
}));

// مسیر فایل JSON
const USERS_FILE = './users.json';

// اطلاعات ادمین
const ADMIN_CREDENTIALS = {
    username: 'Rxoadmin',
    password: 'Mariya1234',
};

// اطمینان از وجود فایل JSON
async function initializeUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }));
    }
}

// میدلور بررسی ادمین
function isAdmin(req, res, next) {
    if (!req.session.isAdmin) {
        return res.status(403).json({ message: 'دسترسی غیرمجاز' });
    }
    next();
}

// ثبت‌نام کاربر
app.post('/api/register', async (req, res) => {
    const { username, password, balance } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        if (json.users.find(user => user.username === username)) {
            return res.status(400).json({ message: 'کاربر قبلاً وجود دارد' });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        // json.users.push({ username, password: hashedPassword, balance });
        json.users.push({ username, password, balance }); // بدون هش
        await fs.writeFile(USERS_FILE, JSON.stringify(json, null, 2));
        req.session.username = username;
        res.status(200).json({ message: 'ثبت‌نام موفق' });
    } catch (err) {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// ورود کاربر
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        const user = json.users.find(user => user.username === username);
        if (!user) {
            return res.status(400).json({ message: 'کاربر یافت نشد' });
        }
        // const match = await bcrypt.compare(password, user.password);
        // if (!match) {
        //     return res.status(400).json({ message: 'رمز عبور اشتباه است' });
        // }
        if (password !== user.password) {
            return res.status(400).json({ message: 'رمز عبور اشتباه است' });
        }
        req.session.username = username;
        res.status(200).json({ message: 'ورود موفق' });
    } catch (err) {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// ورود ادمین
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (username !== ADMIN_CREDENTIALS.username) {
        return res.status(400).json({ message: 'نام کاربری اشتباه است' });
    }
    // const match = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
    // if (!match) {
    //     return res.status(400).json({ message: 'رمز عبور اشتباه است' });
    // }
    if (password !== ADMIN_CREDENTIALS.password) {
        return res.status(400).json({ message: 'رمز عبور اشتباه است' });
    }
    req.session.isAdmin = true;
    res.status(200).json({ message: 'ورود ادمین موفق' });
});

// دریافت لیست کاربران (فقط برای ادمین)
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        res.status(200).json(json.users);
    } catch {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// به‌روزرسانی اعتبار کاربر (فقط برای ادمین)
app.patch('/api/admin/update-balance', isAdmin, async (req, res) => {
    const { username, balance } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        const user = json.users.find(user => user.username === username);
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد' });
        }
        user.balance = balance;
        await fs.writeFile(USERS_FILE, JSON.stringify(json, null, 2));
        res.status(200).json({ message: 'اعتبار به‌روزرسانی شد' });
    } catch {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// دریافت اطلاعات کاربر
app.get('/api/user', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ message: 'وارد نشده‌اید' });
    }
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        const user = json.users.find(user => user.username === req.session.username);
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد' });
        }
        res.status(200).json(user);
    } catch {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// به‌روزرسانی اعتبار
app.patch('/api/user', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ message: 'وارد نشده‌اید' });
    }
    const { balance } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE);
        const json = JSON.parse(data);
        const user = json.users.find(user => user.username === req.session.username);
        if (!user) {
            return res.status(404).json({ message: 'کاربر یافت نشد' });
        }
        user.balance = balance;
        await fs.writeFile(USERS_FILE, JSON.stringify(json, null, 2));
        res.status(200).json(user);
    } catch {
        res.status(500).json({ message: 'خطا در سرور' });
    }
});

// خروج کاربر
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'خروج موفق' });
});
initializeUsersFile().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
app.get('/test', (req, res) => {
    res.status(200).json({ message: 'سرور کار می‌کند' });
});
