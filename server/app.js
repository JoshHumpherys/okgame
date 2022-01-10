const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const ws = require('ws');

const indexRouter = require('./routes/index');
const playersRouter = require('./routes/players');
const tilesRouter = require('./routes/tiles');

const app = express();

const expressWs = require('express-ws')(app);

app.ws('/websockets', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

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

// const wsServer = new ws.Server({ noServer: true, path: '/websocket' });
// wsServer.on('connection', socket => {
//   socket.on('message', message => console.log(message));
// });
// app.on('upgrade', (request, socket, head) => {
//   wsServer.handleUpgrade(request, socket, head, (websocket) => {
//     wsServer.emit('connection', websocket, request);
//   });
// });

app.locals = {
  ...app.locals,
  tiles: [],
  players: [],
}

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
