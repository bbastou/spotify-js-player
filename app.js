const express = require('express');
const http = require('http');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const session = require('express-session');

const index = require('./routes/index');
const spotify = require('./routes/spotify');

const app = express();
const server = http.createServer(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(require('body-parser').urlencoded({ extended: true }));

app.use(cookieParser());
app.use(session({secret: "hello", resave: false, saveUninitialized: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/spotify', spotify);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(8888, () => {
  console.log('listening on *:8888');
});

module.exports = app;