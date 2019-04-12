var express  = require('express');
var app      = express();
var path     = require('path');
var session  = require('express-session');
var flash    = require('connect-flash');
var bodyParser     = require('body-parser');
var cookieParser   = require('cookie-parser');
var methodOverride = require('method-override');
var static = require('serve-static');
var ejs = require('ejs');

// view engine
app.set("view engine", 'ejs');

// middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({secret:'MySecret'}));


// routes
app.use('/', require('./routes/home'));


//css, js, image, fonts 폴더 연결
app.use('/js', static(path.join(__dirname,   'js')));
app.use('/css', static(path.join(__dirname,  'css')));
app.use('/images', static(path.join(__dirname,  'images')));
app.use('/fonts', static(path.join(__dirname,  'fonts')));



// start server
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Server On : %d', port);
});


