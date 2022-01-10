const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
    players: req.app.locals.players
  });
});

router.post('/', function(req, res, next) {
  const { name, color } = req.body;
  const { players } = req.app.locals;

  if (players.length >= 4) {
    res.sendStatus(400);
    return;
  }

  req.app.locals.players.push({ id: req.app.locals.players.length, name, color });
  res.sendStatus(200);
});

router.delete('/', function(req, res, next) {
  const { id } = req.body;
  const { players } = req.app.locals;

  if (id !== undefined) {
    if (_.find(players, value => value.id === id) !== undefined) {
      _.remove(players, value => value.id === id);
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } else {
    req.app.locals.players = [];
    res.sendStatus(200);
  }
});

module.exports = router;
