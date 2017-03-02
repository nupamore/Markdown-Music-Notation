

$(document).ready(function(){
  $mmn = $('.mmn-editor');
  vexflow = $('.vexflow');


  for(var m in $mmn){
    mmn(m);
  }
});


var mmn = function(index){

  var mmn = mmnParser( $mmn[index].value );

  // vexflow
  mmn2vexflow(mmn, $('canvas')[index]);

  // mml
  var mml = mmn2mml(mmn);
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
  mmn();
});
