var express = require('express');
const _ = require("lodash");
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
    tiles: req.app.locals.tiles
  });
});

router.post('/', function(req, res, next) {
  const { x, y, player } = req.body;
  // TODO: Validate new tile.
  req.app.locals.tiles.push({ x, y, player });
  res.sendStatus(200);
});

router.delete('/', function(req, res, next) {
  const { x, y } = req.body;
  if (x !== undefined && y !== undefined) {
    // TODO: Validate tile being deleted.
    _.remove(req.app.locals.tiles, value => value.x === x && value.y === y);
  } else {
    req.app.locals.tiles = [];
  }
  res.sendStatus(200);
});

module.exports = router;
