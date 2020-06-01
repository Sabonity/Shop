const router = require('express').Router();

router.get("/", async(req, res) => {
    res.json({
        "name": "Hello Ariel"
    })
});

module.exports = router;