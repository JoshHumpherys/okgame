var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
    players: req.app.locals.players
  });
});

module.exports = router;
