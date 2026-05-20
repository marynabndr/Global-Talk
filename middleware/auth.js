const jwt = require('jsonwebtoken');
const ACCESS_SECRET = "global_talk_access_secret_2026"; 

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded; 
        next();
    } catch (e) {
        res.status(401).json({ message: "Не авторизований (немає токена)" });
    }
};