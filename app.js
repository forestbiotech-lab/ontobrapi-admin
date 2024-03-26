const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const brapiRouter = require('./routes/brapi');
const formsRouter = require('./routes/forms');
const queryRouter = require('./routes/query');
const factoryRouter = require('./routes/factory');
const explorerRouter = require('./routes/explorer');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/admin/public',express.static(path.join(__dirname, 'public')));


app.use('/admin', indexRouter);
app.use('/admin/brapi', brapiRouter);
app.use('/admin/forms', formsRouter);
app.use('/admin/query', queryRouter);
app.use('/admin/factory', factoryRouter);
app.use('/', explorerRouter);

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
