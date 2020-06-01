const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
    const token = req.header('auth-token');
    let response = {
        success: false,
        responseMessage: 'Invalid Token'
    }
    
    if (!token) return res.status(401).send(response);

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        console.log(error);
        response.responseMessage = 'Invalid Token';
        return res.status(401).send(response);
    }
}