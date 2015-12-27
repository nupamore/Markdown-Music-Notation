
var express = require('express'),
    app = express();
app.listen(80);

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var opt = require('mml-optimizer');

app.get('/opt',function  (req,res) {
  var mml = JSON.parse(req.query.mml);
  for(var track in mml){
    for(var chord in mml[track]){
      mml[track][chord] = opt(mml[track][chord]);
    }
  }
  console.log('optimize');
  res.type('application/json');
  res.jsonp( mml );
});

console.log( 'server start' );
