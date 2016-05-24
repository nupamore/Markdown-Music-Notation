

$(document).ready(function(){
  musicdown = $('.musicdown');
  vexflow = $('.vexflow');


  for(var m in musicdown){
    mdl(m);
  }
});


var mdl = function(index){

  var mdl = mdlParser( musicdown[index].value );

  // vexflow
  mdl2vexflow(mdl, $('canvas')[index]);

  // mml
  var mml = mdl2mml(mdl);
  var mmlText = JSON.stringify(mml,null,4);

  $('#mml').prop('value', mmlText );

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
    url: 'http://nupa.fun25.co.kr:17902/opt?callback=?',
    success: function(data) {
      $('#mml').prop('value', JSON.stringify(data,null,4));
    }
  });
};

$(document).ready(function(){
  mdl();
});
