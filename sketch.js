// make responsive
// prevent refresh on pulling on mobile
// double fire up on android


var nodes = []; // hold notes
var chordnodes = []; // hold chords
var springs = []; // old everything together
// soundfont stuff
var soundBass =  "bright_acoustic_piano"
var soundLead =  "bright_acoustic_piano";
var bass, lead;
var chordOctave =3;
var leadOctave =3;
//  var chordProgression = "C, Dm, Em , F, GM7, Am";
var chordProgression = "C, Dm, Em ";
// "overing" system
var selectedNode = null;
var lastSelectedNode = null;
var gui, sp;
var loading = false;
var font

function preload() {
    font = loadFont("assets/cafeandbrewery.ttf");
    ctx = getAudioContext();
    lead = Soundfont.instrument(ctx, soundLead);
    bass = Soundfont.instrument(ctx, soundBass);
    loading = true;
    bass.then(function (inst) {
        loading = false
        console.log("done", loading);
    });
}


function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    smooth();
    frameRate(25);
    textFont(font);


    // a drawer for general settings

    gui = QuickSettings.create(5, 5, 'General parameters')

    gui.addTextArea('chord progression', chordProgression, build);
    gui.addBoolean('physics', true)
    gui.addBoolean('move nodes', true)
    gui.addBoolean('sound on click', true)
    if(isTouchDevice()){
        gui.addBoolean('sound on over', false)
    }
    else {
        gui.addBoolean('sound on over', true)
    }
    gui.setCollapsible(true)
        // a drawer for sound options
    sp = QuickSettings.create(210, 5, 'Sound Parameters')
    sp.addDropDown("chord instrument", instrumentTable, setBass);
    sp.addNumber("chord octave",1,8,3,1, setChordOctave)
    sp.addDropDown("lead instrument", instrumentTable, setLead);
    sp.addNumber("lead octave",1,8,3,1, setLeadOctave)
    sp.setCollapsible(true);
    // a drawer for physics options
    physics = QuickSettings.create(415, 5, 'Physics Parameters')
    physics.addRange("damping",0,1,0.5,0.1, setDamping)
    physics.addRange("stiffness",0,1,0.5,0.1, setStifness)
    physics.addRange("length",80,200,85,1, setLength)
    // build the network of chords and notes according to the chord progression
    build();
    selectedNode = chordnodes[0];
    lastSelectedNode = chordnodes[0];
    // print a list of all possible chords to be entered
    console.log(Tonal.chord.names())

}

function draw() {
    background(255);
    if (loading) {
        textSize(48);
        textAlign(CENTER, CENTER);
        noStroke();
        fill(255, 25);
        rect(0, 0, windowWidth, windowHeight);
        fill(0, (sin(frameCount / 10) + 1.1) * 60);
        text("loading sounds ... ", windowWidth / 2, windowHeight / 2);
    }
    else {
        // update draw and attract
        for (var i = 0; i < springs.length; i++) {
            springs[i].update();
            springs[i].display();
        }
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].display();
            // update and attract only if physics is ticked in the gui
            if (gui.getValuesAsJSON(false)["physics"]) {
                nodes[i].update();
                for (var j = 0; j < nodes.length; j++) {
                    if (i != j) nodes[i].attract(nodes[j]);
                }
                for (var k = 0; k < chordnodes.length; k++) {
                    chordnodes[k].attract(nodes[i]);
                }
            }
        }
        for (var i = 0; i < chordnodes.length; i++) {
            chordnodes[i].display();
            // update and attract only if physics is ticked in the gui
            if (gui.getValuesAsJSON(false)["physics"]) {
                chordnodes[i].update();
                for (var j = 0; j < chordnodes.length; j++) {
                    if (i != j) chordnodes[i].attract(chordnodes[j]);
                }
            }
        }
    }
}

// user interactions
function mousePressed() {
    check_over(mouseX, mouseY);
}

function touchStarted() {
    for (var i = 0; i < touches.length; i++) {
        check_over(touches[i].x, touches[i].y);
    }

}

function touchMoved() {
    over_and_move();
}

function mouseMoved() {
    over_and_move();
    // overing the nodes
    check_over_non_redundant(mouseX,mouseY);
}

//callbacks

// change audio voice
function setBass() {
    loading = true;
    soundBass = sp.getValuesAsJSON(false)["chord instrument"]
    ctx = getAudioContext();
    bass = Soundfont.instrument(ctx, soundBass)
    bass.then(function (inst) {
        loading = false
        console.log("done", loading);
    });
}
// change audio voice
function setLead() {
    loading = true;
    soundLead = sp.getValuesAsJSON(false)["lead instrument"]
    ctx = getAudioContext();
    lead = Soundfont.instrument(ctx, soundLead)
    lead.then(function (inst) {
        loading = false
        console.log("done", loading);
    });
}

function setChordOctave(){
    if(sp.getValuesAsJSON(false)["chord octave"] !=NaN){
        chordOctave = sp.getValuesAsJSON(false)["chord octave"];
    }
}

function setLeadOctave(){
    if(sp.getValuesAsJSON(false)["lead octave"] !=NaN){
        leadOctave = sp.getValuesAsJSON(false)["lead octave"];
    }
}


function setDamping(){
    for (var i = 0 ; i < springs.length ; i ++){
        springs[i].damping =  physics.getValuesAsJSON(false)["damping"]
    }
}

function setStifness(){
    for (var i = 0 ; i < springs.length ; i ++){
        springs[i].stiffness =  physics.getValuesAsJSON(false)["stiffness"]
    }
}

function setLength(){
    for (var i = 0 ; i < springs.length ; i ++){
        springs[i].length =  physics.getValuesAsJSON(false)["length"]
    }
}

// know if we handle a touch device or not
// http://stackoverflow.com/questions/6262584/how-to-determine-if-the-client-is-a-touch-device
function isTouchDevice() {
   var el = document.createElement('div');
   el.setAttribute('ongesturestart', 'return;'); // or try "ontouchstart"
   return typeof el.ongesturestart === "function";
}
// list of available soundfonts
var instrumentTable = [
     "bright_acoustic_piano"
    , "accordion"
    , "acoustic_bass"
    , "acoustic_grand_piano"
    , "acoustic_guitar_nylon"
    , "acoustic_guitar_steel"
    , "agogo"
    , "alto_sax"
    , "applause"
    , //"bagpipe", // doesn't work
    "banjo"
    , "baritone_sax"
    , "bassoon"
    , "bird_tweet"
    , "blown_bottle"
    , "brass_section"
    , "breath_noise"
    , "bright_acoustic_piano"
    , "celesta"
    , "cello"
    , "choir_aahs"
    , "church_organ"
    , "clarinet"
    , //"clavinet", // doesn't work
    "contrabass"
    , "distortion_guitar"
    , "drawbar_organ"
    , "dulcimer"
    , "electric_bass_finger"
    , "electric_bass_pick"
   	, "electric_grand_piano"
    , "electric_guitar_clean"
    , "electric_guitar_jazz"
    , "electric_guitar_muted"
    , "electric_piano_1"
    , "electric_piano_2"
    , "english_horn"
    , "fiddle"
    , "flute"
    , "french_horn"
    , "fretless_bass"
    , "fx_1_rain"
    , "fx_2_soundtrack"
    , "fx_3_crystal"
    , "fx_4_atmosphere"
    , "fx_5_brightness"
    , "fx_6_goblins"
    , "fx_7_echoes"
    , "fx_8_scifi"
    , "glockenspiel"
    , "guitar_fret_noise"
    , "guitar_harmonics"
    , "gunshot"
    , "harmonica"
    , "harpsichord"
    , "helicopter"
    , "honkytonk_piano"
    , "kalimba"
    , "koto"
    , "lead_1_square"
    , "lead_2_sawtooth"
    , "lead_3_calliope"
    , "lead_4_chiff"
    , "lead_5_charang"
    , "lead_6_voice"
    , "lead_7_fifths"
    , //"lead_8_bass__lead", // doesn't work
    "marimba"
    , "melodic_tom"
    , "music_box"
    , "muted_trumpet"
    , "oboe"
    , "ocarina"
    , "orchestra_hit"
    , "orchestral_harp"
    , "overdriven_guitar"
    , "pad_1_new_age"
    , "pad_2_warm"
    , "pad_3_polysynth"
    , "pad_4_choir"
    , "pad_5_bowed"
    , "pad_6_metallic"
    , "pad_7_halo"
    , "pad_8_sweep"
    , "pan_flute"
    , "percussive_organ"
    , "piccolo"
    , "pizzicato_strings"
    , "recorder"
    , "reed_organ"
    , //"reverse_cymbal",
    "rock_organ"
    , //"seashore",
    "shakuhachi"
    , "shamisen"
    , "shanai"
    , "sitar"
    , "slap_bass_1"
    , "slap_bass_2"
    , "soprano_sax"
    , "steel_drums"
    , "string_ensemble_1"
    , "string_ensemble_2"
    , "synth_bass_1"
    , "synth_bass_2"
    , //"synth_brass_1", // doesn't work
    //"synth_brass_2", // doesn't work
    //"synth_choir", // doesn't work
    //"synth_drum",
    //"synth_strings_1", // doesn't work
    //"synth_strings_2", // doesn't work
    //"taiko_drum",
    "tango_accordion"
    , "telephone_ring"
    , "tenor_sax"
    , "timpani"
    , "tinkle_bell"
    , "tremolo_strings"
    , "trombone"
    , "trumpet"
    , "tuba"
    , "tubular_bells"
    , "vibraphone"
    , "viola"
    , "violin"
    , "voice_oohs"
    , "whistle"
    , "woodblock"
    , "xylophone"
];
