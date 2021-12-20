var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var playersRouter = require('./routes/players');
var tilesRouter = require('./routes/tiles');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/players', playersRouter);
app.use('/tiles', tilesRouter);

app.locals = {
  ...app.locals,
  tiles: [],
  players: [
    // {
    //   id: 0,
    //   name: 'Player 1',
    //   color: 'blue'
    // },
    // {
    //   id: 1,
    //   name: 'Player 2',
    //   color: 'orange'
    // },
    // {
    //   id: 2,
    //   name: 'Player 3',
    //   color: 'pink'
    // },
    // {
    //   id: 3,
    //   name: 'Player 4',
    //   color: 'green'
    // }
  ],
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
