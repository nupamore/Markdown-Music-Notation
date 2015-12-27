
var mdl = function(){
  var mdl = mdlParser( $('#musicdown').prop('value') );


  // vextab
  /*
  var vextab = mdl2vextab(mdl);
  $('.editor').prop('value',vextab);
  $('.editor').trigger('keyup');
  */

  // mml
  var mml = mdl2mml(mdl);
  var mmlText = JSON.stringify(mml,null,4);

  $('#mml').prop('value', mmlText );

  // vexflow
  mdl2vexflow(mdl, $('canvas')[0]);
};

var play = function(){

  var mml = JSON.parse( $('#mml').prop('value') );
  var mmlArray = [];
  for(var chord in mml){
    for(var c in mml[chord]){
      mmlArray.push( mml[chord][c] );
    }
  }

  var gen = T("OscGen", {wave:"pulse", env:{type:"adsr", r:150}, mul:0.25}).play();

  T("mml", {mml: mmlArray }, gen).on("ended", function() {
    gen.pause();
    this.stop();
  }).start();
};

var opt = function(){
  $.ajax({
    dataType: 'jsonp',
    data: 'mml=' + $('#mml').prop('value'),
    jsonp: 'callback',
    url: 'http://dm1425968007895.fun25.co.kr/opt?callback=?',
    success: function(data) {
      $('#mml').prop('value', JSON.stringify(data,null,4));
    }
  });
};

$(document).ready(function(){
  mdl();
});
