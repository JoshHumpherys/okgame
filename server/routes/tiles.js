var express = require('express');
// const { locals } = require("express/lib/application");
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({
    tiles: req.app.locals.tiles
    // tiles: [
    //   { x: 0, y: 0, player: 0 },
    //   { x: 2, y: 0, player: 1 },
    //   { x: 0, y: 3, player: 1 },
    //   { x: 0, y: 0, player: 0 },
    //   { x: 1, y: 0, player: 1 },
    //   { x: 0, y: 4, player: 0 },
    // ]
  });
});

router.post('/', function(req, res, next) {
  const { x, y, player } = req.body;
  // TODO: Validate new tile.
  req.app.locals.tiles.push({ x, y, player });
  res.send(200);
});

router.delete('/', function(req, res, next) {
  req.app.locals.tiles = [];
  res.send(200);
});

module.exports = router;
