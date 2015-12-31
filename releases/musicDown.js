
(function(){

this.mdlParser = function( text ){};
this.mdl2vexflow = function( mdl, canvas ){};
this.mdl2vextab = function( mdl ){};
this.mdl2mml = function( mdl ){};

var LENGTH_RANGE = 6720;

var kor2eng = function(kor){
  return {
    '\ub3c4': 'C',
    '\ub808': 'D',
    '\ubbf8': 'E',
    '\ud30c': 'F',
    '\uc194': 'G',
    '\ub77c': 'A',
    '\uc2dc': 'B'
  }[kor] || kor;
};

var keyConfig = {
  'C': [''],
  'C#': ['+', /[CDEFGAB]/],
  'Db': ['-', /[DEGAB]/],
  'D': ['+', /[FC]/],
  'Eb': ['-', /[EAB]/],
  'E': ['+', /[FGCD]/],
  'F': ['-', /[B]/],
  'F#': ['+', /[FGACDE]/],
  'Gb': ['-', /[GABCDE]/],
  'G': ['+', /[F]/],
  'Ab': ['-', /[ABDE]/],
  'A': ['+', /[CFG]/],
  'Bb': ['-', /[BE]/],
  'B': ['+', /[CDFGA]/],
};

var convertLength = (function(){
  var l = LENGTH_RANGE;
  var dic = {
    '64t':l/64 /3*2,
    '64f':l/64 /5*4,
    '64':l/64,
    '32t':l/32 /5*4,
    '32f':l/32 /3*2,
    '32s':l/32 /7*8,
    '32':l/32,
    '32d':l/32 + l/32/2,
    '16t':l/16 /3*2,
    '16f':l/16 /5*4,
    '16s':l/16 /7*8,
    '16':l/16,
    '16d':l/16 + l/16/2,
    '8t':l/8 /3*2,
    '8f':l/8 /5*4,
    '8s':l/8 /7*8,
    '8':l/8,
    '8d':l/8 + l/8/2,
    '4t':l/4 /3*2,
    '4f':l/4 /5*4,
    '4':l/4,
    '4d':l/4 + l/4/2,
    '2t':l/2 /3*2,
    '2':l/2,
    '2d':l/2 + l/2/2,
    '1':l
  };
  return function(length){
    if((typeof length) == 'string'){
      return dic[length];
    }
    else if((typeof length) == 'number'){
      for(var i in dic){
        if(dic[i]==length) return i;
      }
    }
  }
})();

var error = function(type, text, point){
  var errorText = 'error: ' + type + '\n\n';
  errorText += text + '\n';
  for(var i=0; i<point; i++){
    errorText += ' ';
  }
  //errorText += '^';
  console.log(errorText);
};

this.mdlParser = function(text){

  var rows = [],            // code rows
      staffs = [],          // staff rows
      timeline = [];        // parsed score

  // split rows, type check
  (function(){
    text = text.replace(/ /g,'');
    text = text.replace(/\n+/g,';');
    // auto enter
    text = text.replace(/(\'+[a-zA-Z]+:.*?\')/g,";$1;");
    // coment
    text = text.replace(/\/\*.*?\*\//g,'');
    text = text.split(/;+/);

    for(var i in text){
      var row = {
        type: '',
        note: ''
      };

      switch( text[i].trim().charAt(0) ){
        case '\'': row.type = 'superscript'; break;
        case '\"': row.type = 'subscript'; break;
        case '|' : row.type = 'melody'; break;
        default:
          if( text[i].trim()=='' )
            continue;
          row.type = 'chords';
        break;
      }

      row.note = text[i].trim();
      rows.push(row);
    }
  })();

  // group staffs
  (function(){
    j = 0;
    for(var i in rows){
      if( rows[i].type=='superscript' || rows[i].type=='melody' )
      if( i==0 || rows[i-1].type=='subscript' || rows[i-1].type=='chords' || rows[i-1].type=='melody' ){
        staffs[j++] = {
          superscript: [],
          melody: '',
          chords: [],
          subscript: ''
        };
      }
      switch( rows[i].type ){
        case 'superscript': staffs[j-1].superscript.push(rows[i].note); break;
        case 'subscript': staffs[j-1].subscript = rows[i].note; break;
        case 'melody': staffs[j-1].melody = rows[i].note; break;
        case 'chords' : staffs[j-1].chords.push(rows[i].note); break;
      }
    }
  })();

  // analyze staff
  (function(){
    var trackConfig = {};
    /* global state */
    var volume = 8,
        tempo = 120,
        key = 'C',
        length = LENGTH_RANGE/8,
        meter = '4/4',
        clef = 'treble';
    /* global state end */

    for(var i=0; i<staffs.length; i++){

      /* row state */
      var melody = staffs[i].melody.split(''),
          track = 'track1',
          bar = false,
          end = false,
          events = false,
          eventCount = 0,
          note = '',
          octave = 4,
          time = 0,
          tuplet = -1,
          eventLength = {};
      /* row state end */
      if(i){
        track = Object.keys(trackConfig)[0];
      }

      // events
      var eventsObject = [];
      for(var scr in staffs[i].superscript){
        var sup = staffs[i].superscript[scr].match(/'.*?'/g);
        for(var s in sup){
          if(!eventsObject[s])
            eventsObject[s] = {};
          var ev = sup[s].replace(/ /g,'');
          ev = ev.substring(1, ev.length-1).split(',');
          for(var e in ev){
            // track
            if(ev[e]!='' && !ev[e].match(':')){
              track = ev[e];
              if( !trackConfig[track] ){
                trackConfig[track] = {
                  volume: 8,
                  key: 'C',
                  defaultLength: LENGTH_RANGE/8,
                  clef: 'treble'
                };
              }
            }
            // treck end
            else
              eventsObject[s][ev[e].split(':')[0].toLowerCase()] = ev[e].split(':')[1];
          }
        }
      }

      timeline[i] = [];
      // melody
      for(var m in melody){
        if( !melody[m].match(/[A-G0-9|#nbd><*\-=:,&'.\(\) \ub3c4-\ud30c]/) ){
          error( "grammorError. don't use "+melody[m], staffs[i].melody, m );
          continue;
        }
        switch(melody[m]){
          case ':': break;
          case ' ': break;
          case '>': octave++; break;
          case '<': octave--; break;
          case '*': events=true; eventCount++; break;
          case '\'': timeline[i][time-1].octave[0]++; break;
          case '.': timeline[i][time-1].octave[0]--; break;
          case '|':
            bar = 'bar';
            // last character bar check
            if(m==melody.length-1)
              timeline[i][time-1].end = true;
          break;
          case '-': timeline[i][time-1].noteLen += length; break;
          case '=': timeline[i][time-1].noteLen += length*2; break;
          case '#': timeline[i][time-1].note[0]+='#'; break;
          case 'b': timeline[i][time-1].note[0]+='b'; break;
          case 'n': timeline[i][time-1].note[0]+='n'; break;

          // tuplet
          case '(': tuplet=0; break;
          case ')':
            if(tuplet==3 || tuplet==5){
              for(var t=1; t<=tuplet; t++){
                if( timeline[i][time-t] && timeline[i][time-t].tupletCheck )
                  timeline[i][time-t].noteLen = timeline[i][time-t].noteLen - timeline[i][time-t].noteLen/(tuplet);
              }
            }
            else if(tuplet==7){
              for(var t=1; t<=tuplet; t++){
                if( timeline[i][time-t] && timeline[i][time-t].tupletCheck )
                  timeline[i][time-t].noteLen = timeline[i][time-t].noteLen + timeline[i][time-t].noteLen/(tuplet);
              }
            }
            else if(tuplet==6){
              for(var t=1; t<=tuplet; t++){
                if( timeline[i][time-t] && timeline[i][time-t].tupletCheck ){
                  timeline[i][time-t].noteLen = timeline[i][time-t].noteLen - timeline[i][time-t].noteLen/(tuplet/2);
                  if(timeline[i][time-t].tupletCheck>3)
                    timeline[i][time-t].tupletCheck = timeline[i][time-t].tupletCheck-3;
                }
              }
            }
            tuplet = -1;
          break;

          // note
          case ',':
            if( !bar && timeline[i][time-1].note[0]=='R' ){
              timeline[i][time-1].noteLen += length;
              if(!!~tuplet) tuplet++;
              break;
            }
            melody[m] = 'R';
          //break;
          case '&':
          //break;
          default:
            // number length type
            if(melody[m].match(/[0-9d]/)){
              timeline[i][time-1].noteLenConv += melody[m];
              timeline[i][time-1].noteLen = convertLength(timeline[i][time-1].noteLenConv);
              continue;
            }
            // first character
            if(!time){
              bar = 'start';
              events = true;
              if(trackConfig[track]){
                volume = trackConfig[track].volume,
                key = trackConfig[track].key,
                length = trackConfig[track].defaultLength,
                clef = trackConfig[track].clef;
              }
            }
            // tuplet check
            if(!!~tuplet) tuplet++;
            // event execute
            if(events){
              for(var e in eventsObject[eventCount]){
                var ev = eventsObject[eventCount][e];
                switch( e ){
                  case 't':
                  case 'tempo':
                    if(ev.match('-')){
                      var presentTempo = tempo,
                          finalTempo = ev.split('-')[0],
                          num = ev.split('-')[1];
                      eventLength.tempo = {
                        add: (finalTempo-presentTempo)/num,
                        num: num,
                        final: finalTempo
                      };
                    }
                    else tempo = ev*1;
                  break;
                  case 'l':
                  case 'length':
                    length = convertLength( ev );
                  break;
                  case 'v':
                  case 'volume':
                    if(ev.match('-')){
                      var presentVolume = volume,
                          finalVolume = ev.split('-')[0],
                          num = ev.split('-')[1];
                      eventLength.volume = {
                        add: (finalVolume-presentVolume)/num,
                        num: num,
                        final: finalVolume
                      };
                    }
                    else volume = ev*1;
                  break;
                  case 'key':
                    key = ev;
                  break;
                  case 'time':
                    meter = ev;
                  break;
                  case 'clef':
                    clef = ev;
                  break;
                }
              }
            }
            for(var ev in eventLength){
              switch(ev){
                case 'tempo':
                  tempo += eventLength.tempo.add;
                  eventLength.tempo.num--;
                  if(!eventLength.tempo.num){
                    tempo = eventLength.tempo.final;
                    delete eventLength.tempo;
                  }
                break;
                case 'volume':
                  volume += eventLength.volume.add;
                  eventLength.volume.num--;
                  if(!eventLength.volume.num){
                    volume = eventLength.volume.final;
                    delete eventLength.volume;
                  }
                break;
              }
            }

            timeline[i].push({
              track: track,
              events: events,
              key: key,
              meter: meter,
              clef: clef,
              volume: volume,
              tempo: tempo,
              octave: [octave],
              note: [kor2eng(melody[m])],
              noteLen: length,
              noteLenConv: '',
              bar: bar,
              end: end,
              tupletCheck: tuplet
            });
            trackConfig[track] = {
              key: key,
              clef: clef,
              volume: volume,
              defaultLength: length
            };
            bar = '';
            events = false;
            length = length;
            time++;
          break;
        }
      }

      // chord
      for(var n=0; n<staffs[i].chords.length; n++){
        var chord = staffs[i].chords[n].split('');
        var octave = 4,
            time = 0;
        for(var c in chord){
          if( !chord[c].match(/[A-G|#bn><\-,&'. \ub3c4-\ud30c]/) ){
            error( "grammorError. don't use "+chord[c], staffs[i].chords[n], c );
            continue;
          }
          switch(chord[c]){
            case '>': octave++; break;
            case '<': octave--; break;
            case '\'': timeline[i][time-1].octave[n+1]++; break;
            case '.': timeline[i][time-1].octave[n+1]--; break;
            case '#': timeline[i][time-1].note[n+1]+='#'; break;
            case 'b': timeline[i][time-1].note[n+1]+='b'; break;
            case 'n': timeline[i][time-1].note[n+1]+='n'; break;
            case '-': time++; break;
            case ',': time++; break;
            case '|': break;
            case ' ': break;
            default:
              if( 'R'==timeline[i][time].note[0] ){
                timeline[i][time].note.pop();
                timeline[i][time].octave.pop();
              }
              timeline[i][time].note.push(kor2eng(chord[c]));
              timeline[i][time].octave.push(octave);
              time++;
            break;
          }
        }
      }

      // text
      var sub = staffs[i].subscript.match(/".*?"/g);
      for(var t in timeline[i]){
        if(timeline[i][t].events==true){
          if( sub && sub.length ){
            timeline[i][t].subscript = sub[0].substring(1, sub[0].length-1);
            sub.splice(0,1);
          }
        }
      }

      // last bar check
      if(i && !timeline[i-1][ timeline[i-1].length-1 ].end){
        timeline[i][0].bar = 'bar';
        timeline[i-1] = timeline[i-1].concat( timeline[i] );
        timeline.pop();
      }
    }

  })();

  return timeline;
};

// vextab converter
this.mdl2vextab = function(mdl){
  var mdl = JSON.parse( JSON.stringify( mdl ) );

  var vextab = '',
      notePanel = '',
      tuplet = 0,
      tupletCheck = 0,
      meter = '';
  for(var i in mdl){
    vextab += 'tabstave notation=true tablature=false ';
    vextab += 'key=' + mdl[i][0].key + ' ';
    if( meter!=mdl[i][0].meter ){
      meter = mdl[i][0].meter;
      vextab += 'time=' + meter;
    }
    vextab += '\n';
    vextab += 'notes ';

    for(var j in mdl[i]){
      var note = mdl[i][j];
      if( j!=0 && note.bar=='bar' ){
        vextab += ' | ';
      }
      // length
      var convLen = convertLength(note.noteLen);
      if(convLen.match(/[tfs]/)){
        tuplet = { t:3, f:5, s:7 }[convLen.charAt(convLen.length-1)];
        tupletCheck = note.tupletCheck;
        vextab += ':'+ convLen.substring(0,convLen.length-1);
      }
      else vextab += ':'+ convLen;
      // note
      notePanel = '(';
      for(var n in note.note){
        if(note.note[n].charAt(1)=='b'){
          note.note[n] = note.note[n].charAt(0)+'@';
        }
        switch(note.note[n]){
          case '&': notePanel += 'h'+mdl[i][j-1].note[n]; break;
          case 'R': notePanel += '##'; break;
          default: notePanel += note.note[n]; break;
        }
      // octave
        notePanel += '/'+note.octave[n];
        if( n!=note.note.length-1 ) notePanel += '.';
      }
      notePanel += ')';
      vextab += ( !!~notePanel.indexOf('##') )? '##' : notePanel;
      // subscript
      vextab += (note.subscript)? '$'+note.subscript+'$ ' : ' ';
      // tuplet
      if(tuplet && tuplet==tupletCheck){
        vextab += '^'+tuplet+'^ ';
        tuplet = 0; tupletCheck = 0;
      }
    }

    vextab += '\n';
  }

  return vextab;
};


// mml converter
this.mdl2mml = function(mdl){
  var mdl = JSON.parse( JSON.stringify( mdl ) ),
      track = {};

  for(var i=1; i<mdl.length; i++){
    mdl[0] = mdl[0].concat(mdl[i]);
  }
  mdl = mdl[0];

  for(var i in mdl){
    if( !track[mdl[i].track] )
      track[mdl[i].track] = [];
    while(mdl[i].note.length > track[mdl[i].track].length)
      track[mdl[i].track].push('');
  }

  for(var t in track){
    for(var c in track[t]){
      var tempo = 0,
          volume = 0,
          octave = 0;
      for(var i in mdl){
        if(t != mdl[i].track)
          continue;
        // event
        if(mdl[i].tempo != tempo){
          tempo = mdl[i].tempo;
          track[t][c] += 't' + tempo;
        }
        if(mdl[i].volume != volume){
          volume = mdl[i].volume;
          track[t][c] += 'v' + volume;
        }
        // note
        if(mdl[i].note[c]){
          // octave
          if( octave != mdl[i].octave[c] ){
            octave += mdl[i].octave[c]-octave;
            if(mdl[i].note[c].charAt(0)=='&'){
              octave = mdl[i-1].octave[c];
            }
            track[t][c] += 'o'+octave;
          }
          // key
          if( '+'==keyConfig[mdl[i].key][0] ){
            if( mdl[i].note[c].match(keyConfig[mdl[i].key][1]) ){
              if( 1==mdl[i].note[c].length ){
                mdl[i].note[c] += '#';
              }
            }
          }
          else if( '-'==keyConfig[mdl[i].key][0] ){
            if( mdl[i].note[c].match(keyConfig[mdl[i].key][1]) ){
              if( 1==mdl[i].note[c].length ){
                mdl[i].note[c] += 'b';
              }
            }
          }

          track[t][c] += mdl[i].note[c].charAt(0);
          if(mdl[i].note[c].charAt(0)=='&'){
            track[t][c] += mdl[i-1].note[c].charAt(0);
          }
          track[t][c] += {
            '#': '+',
            'b': '-'
          }[mdl[i].note[c].charAt(1)] || '';
        }
        else {
          track[t][c] += 'R';
        }
        // length
        var convLen = convertLength(mdl[i].noteLen);
        var len = convLen.substring(0,convLen.length-1)*1;
        var tuplet = convLen.charAt(convLen.length-1);
        track[t][c] += {
          'd': len + '.',
          't': len + len/2,
          'f': len + len/4,
          's': len - len/8
        }[tuplet] || convLen;
      }
      track[t][c] = track[t][c].toLowerCase();
    }
  }

  return track;
};


// vexflow renderer
this.mdl2vexflow = function(mdl, canvas){
  var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS),
      ctx = renderer.getContext(),
      staveWidth = canvas.width-200;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "15px Consolas";

  var stave = [],
      mainTrack = mdl[0][0].track,
      mainBarWidth = [],
      mainTrackIndex = 0,
      staveSpace = -40,
      TRACK_SPACE = 20,
      ROW_SPACE = 100,
      trackName = [],
      meter = '';
  for(var s=0; s<mdl.length; s++){
    if( s && mainTrack == mdl[s][0].track )
      staveSpace += TRACK_SPACE;

    var notes = [],
        beamsIndex = [],
        tiesIndex = [],
        tupletIndex = [],
        noteLen = 0,
        bar = 0,
        barIndex = 0;

    notes[0] = [];
    beamsIndex[0] = [0];

    for(var i=0; i<mdl[s].length; i++){
      // bar
      if(mdl[s][i].bar=='bar'){
        bar++;
        notes[bar] = [];
        beamsIndex[bar] = [0];
        barIndex = 0;
      }
      // beam
      noteLen += mdl[s][i].noteLen;
      if( noteLen >= LENGTH_RANGE/4 ){
        noteLen = 0;
        beamsIndex[bar].push(barIndex+1);
      }
      // note
      var keys = [];
      var convertLen = convertLength(mdl[s][i].noteLen);
      mdl[s][i].note = mdl[s][i].note.reverse();
      mdl[s][i].octave = mdl[s][i].octave.reverse();
      for(var c in mdl[s][i].note){
        switch(mdl[s][i].note[c]){
          case '&':
            keys.push(mdl[s][i-1].note[c]+'/'+mdl[s][i-1].octave[c]);
            tiesIndex.push({
              bar: bar,
              index: notes[bar].length
            });
          break;
          default:
            keys.push(mdl[s][i].note[c]+'/'+mdl[s][i].octave[c]);
          break;
        }
      }

      if(!!~mdl[s][i].tupletCheck){
          convertLen = convertLen.replace(/[tfs]/,'');
          if(mdl[s][i].tupletCheck == 1){
            tupletIndex.push({
              bar: bar,
              index: barIndex,
              len: 0
            });
          }
          tupletIndex[tupletIndex.length-1].len = mdl[s][i].tupletCheck;
      }
      if('R' == mdl[s][i].note[0].charAt(0)){
        convertLen += 'r';
      }

      var note = new Vex.Flow.StaveNote({
        clef: mdl[s][i].clef,
        keys: keys,
        duration: convertLen
      });

      if(convertLen.charAt(convertLen.length-1)=='d'){
        note.addDotToAll();
      }

      for(var c in mdl[s][i].note){
        if( mdl[s][i].note[c].charAt(1) ){
          switch( mdl[s][i].note[c].charAt(1) ){
            case '#': note.addAccidental(c, new Vex.Flow.Accidental("#")); break;
            case 'b': note.addAccidental(c, new Vex.Flow.Accidental("b")); break;
            case 'n': note.addAccidental(c, new Vex.Flow.Accidental("n")); break;
          }
        }
      }
      notes[bar].push( note );

      barIndex++;
    }

    // stave draw
    stave[s] = [];
      // calc bar size
    if(mdl[s][0].track == mainTrack){
      var barWidth = [];
      var sum = 3;
      for(var b=0; b<notes.length; b++){
        var length = notes[b].length+5;
        if(length<8) length+=3;
        barWidth[b] = length;
        sum += length;
      }
      barWidth[0] += 3;
      mainBarWidth.push(barWidth);
    }
    else{
      mainBarWidth.push(mainBarWidth[s-1]);
    }

    for(var b=0; b<=bar; b++){
      if(!b){
        stave[s][0] = new Vex.Flow.Stave(100, staveSpace+=ROW_SPACE, staveWidth*(mainBarWidth[s][0]/sum));
        stave[s][0].addClef( mdl[s][0].clef );
        stave[s][0].addKeySignature( mdl[s][0].key );
        if( !trackName[mdl[s][0].track] || meter!=mdl[s][0].meter ){
          meter = mdl[s][0].meter;
          stave[s][0].addTimeSignature( meter );
          trackName[mdl[s][0].track] = 1;
        }
        stave[s][0].setContext(ctx).draw();
      }
      else{
        stave[s][b] = new Vex.Flow.Stave(stave[s][b-1].width + stave[s][b-1].x, staveSpace, staveWidth*(mainBarWidth[s][b]/sum));
        stave[s][b].setContext(ctx).draw();
      }

      // beams analyze
      var beams = [];
      for(var i=0; i<beamsIndex[b].length-1; i++){
        var note = notes[b].slice(beamsIndex[b][i], beamsIndex[b][i+1]);
        if(note.length!=1)
          beams.push( new Vex.Flow.Beam(note) );
      }

      // Helper function to justify and draw a 4/4 voice
      Vex.Flow.Formatter.FormatAndDraw(ctx, stave[s][b], notes[b]);

      // Render beams
      for(var beam in beams){
        beams[beam].setContext(ctx).draw();
      }
    }
    // render ties
    for(var tie in tiesIndex){
      var bar = tiesIndex[tie].bar,
          index = tiesIndex[tie].index,
          beforeBar = bar,
          beforeIndex = index-1;

      if(tiesIndex[tie].index == 0){
        beforeBar--;
        beforeIndex = notes[beforeBar].length-1;
      }

      new Vex.Flow.StaveTie({
        first_note: notes[ beforeBar ][ beforeIndex ],
        last_note: notes[ bar ][ index ],
        first_indices: [0],
        last_indices: [0]
      }).setContext(ctx).draw();
    }
    // render tuplet
    for(var tuplet in tupletIndex){
      var bar = tupletIndex[tuplet].bar,
          index = tupletIndex[tuplet].index,
          length = index + tupletIndex[tuplet].len;

      new Vex.Flow.Tuplet(notes[bar].slice(index,length)).setContext(ctx).draw();
    }


    // line
    if( s && mainTrack==mdl[s][0].track ){
      new Vex.Flow.StaveConnector(stave[mainTrackIndex][0], stave[s-1][0]).setType(1).setContext(ctx).draw();
      mainTrackIndex = s;
    }
    else if( s == mdl.length-1 ){
      new Vex.Flow.StaveConnector(stave[mainTrackIndex][0], stave[s][0]).setType(1).setContext(ctx).draw();
    }
    // trackName
    var wordLength = 12;
    if( !mainTrackIndex ){
      if(mdl[s][0].track.length >= wordLength){
        ctx.fillText(mdl[s][0].track.slice(0,wordLength), 10, 55+staveSpace);
        ctx.fillText(mdl[s][0].track.slice(wordLength,mdl[s][0].track.length), 10, 75+staveSpace);
      }
      else{
        ctx.fillText(mdl[s][0].track, 10, 65+staveSpace);
      }
    }
  }

};


})();
