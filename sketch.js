// gui physics damping stifness radius strength
// gui sound = note duration, octave // add volume , loop, octave per instrument
// gui sound button reset voices
// colors : rework colors : gradients according to the number of occurences of notes in chords, and for chords the sum of their notes occurences ?
// some kind of sequencer : tap tap ?
// make a better spatial layout than random position at building
// imaginer un mode jeu en jouant avec le bouclage des buffers audio // accords et notes séparement // il serait bien de brancher des env pour animer la couleur des noeuds qui jouent
// ajouter quelques progression harmoniques de morceaux connus avec des presets de soundfont

var nodes = []; // hold notes
var chordnodes = []; // hold chords
var springs = []; // old everything together
// soundfont stuff
var soundBass = "voice_oohs"
var soundLead = "voice_oohs";
var bass, lead;

var chordProgression = "C, Dm, Em , F, GM7, Am";

// "overing" system
var selectedNode = null;
var lastSelectedNode = null;

var gui, sp;



function preload() {
    ctx = getAudioContext();
    lead = Soundfont.instrument(ctx, soundLead);
    bass = Soundfont.instrument(ctx, soundBass);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB,360,100,100,100);
    smooth();
    frameRate(25);

    // a drawer for general settings
    gui = QuickSettings.create(5, 5, 'General parameters')
    gui.addTextArea('chord progression', chordProgression, build);
    gui.addBoolean('physics', true)
    gui.addBoolean('sound', true)
    gui.addBoolean('move nodes', true)
    gui.setCollapsible(true)

    // a drawer for sound options
    sp = QuickSettings.create(210, 5, 'Sound Parameters')
    sp.addDropDown("chord instrument" , instrumentTable, setBass);
    sp.addDropDown("lead instrument" , instrumentTable, setLead);
    sp.collapse();

    // build the network of chords and notes according to the chord progression
    build();

    selectedNode = chordnodes[0];
    lastSelectedNode = chordnodes[0];
    // print a list of all possible chords to be entered
    console.log(Tonal.chord.names())
}

function draw() {
    background(0);

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

    // overing the nodes
    check_over();

    // move the nodes with the mouse
    if (gui.getValuesAsJSON(false)["move nodes"]) {
        if (mouseIsPressed) {
            for (var i = 0; i < nodes.length; i++) {
                var d = dist(pmouseX, pmouseY, nodes[i].location.x, nodes[i].location.y);
                if (d < 50) {
                    nodes[i].location.y = mouseY
                    nodes[i].location.x = mouseX
                }
            }
            for (var i = 0; i < chordnodes.length; i++) {
                var d = dist(pmouseX, pmouseY, chordnodes[i].location.x, chordnodes[i].location.y);
                if (d < 50) {
                    chordnodes[i].location.x = mouseX
                    chordnodes[i].location.y = mouseY
                }
            }
        }
    }
}

function check_over() {
    var maxDist = 50; // threshold
    // first check the note nodes
    for (var i = 0; i < nodes.length; i++) {
        var checkNode = nodes[i];
        var d = dist(mouseX, mouseY, checkNode.location.x, checkNode.location.y);
        if (d < maxDist) {
            selectedNode = checkNode;
            // play audio
            if (selectedNode.id != lastSelectedNode.id) { // if it not the same as precedent
                lastSelectedNode = selectedNode;
                if (gui.getValuesAsJSON(false)["sound"]) {
                    // we actually call the instrument right here
                    lead.then(function (inst) {
                        var noteToPlay = lastSelectedNode.midinotes;
                        inst.play(noteToPlay +3, 0, {
                            loop: false
                        });
                    });
                }
            }
        }
    }
    // check the chord nodes
    for (var i = 0; i < chordnodes.length; i++) {
        var checkNode = chordnodes[i];
        var d = dist(mouseX, mouseY, checkNode.location.x, checkNode.location.y);
        if (d < maxDist) {
            selectedNode = checkNode;
            if (selectedNode.id != lastSelectedNode.id) {
                lastSelectedNode = selectedNode;
                if (gui.getValuesAsJSON(false)["sound"]) {
                    bass.then(function (inst) {
                        var noteToPlay = lastSelectedNode.midinotes;
                        for (var j = 0; j < noteToPlay.length; j++) {
                            var note = noteToPlay[j];
                            inst.play(note +3 , 0, {
                                loop: false
                            });
                        }
                    });
                }
            }
        }
    }
    // highlight a specific node
    noFill();
    stroke(255);
    ellipse(lastSelectedNode.location.x, lastSelectedNode.location.y, lastSelectedNode.diameter + 5, lastSelectedNode.diameter + 5);
}

// this function builds a network of nodes linked by springs
// according to the cord progression
function build(params) {
    chordnodes = [];
    nodes = [];
    springs = [];
    chordProgression = gui.getValuesAsJSON(false)["chord progression"].split(",");
    // search for chords from chordProgression into our Table and create chord nodes for each of them
    var noteSeries = [];// we want to keep track of the notes for each chord.
    for (var j = 0; j < chordProgression.length; j++) {
        var c = chordProgression[j].trim();
        var xpos = random(100, width - 100);
        var ypos = random(100, height - 100);
        // add a new node to the chordnodes array
        chordnodes.push(new Node(xpos, ypos, chordnodes.length, c, 80, Tonal.chord(c), color(180,0,100)));

        var chordnotes = Tonal.chord(c)
        for (var i = 0; i < chordnotes.length; i++) {
            noteSeries.push(chordnotes[i])
        }
    }
    // sort the notes by number of occurences
    noteSeries = sortA(noteSeries)
    // now iterate over the new chordnodes array to populate our notes array
    for (var i = 0; i < chordnodes.length; i++) {
        // browse the midinotes array that holds each note of the chord and create new note nodes attached to the chord node with a spring
        for (var j = 0; j < chordnodes[i].midinotes.length; j++) {
            // if there is no nodes we create the first one with its notes attached
            if (nodes.length == 0) {
                var xpos = random(100, width - 100);
                var ypos = random(100, height - 100);
                // new note
                nodes.push(new Node(xpos, ypos, chordnodes.length + nodes.length, chordnodes[i].midinotes[0], 50, chordnodes[i].midinotes[0], color(noteSeries[chordnodes[i].midinotes[0]] * 60, 100, 100)));
                // new spring
                var s = new Spring(chordnodes[i], nodes[0], noteSeries[nodes[0].midinotes[0]] * 75);
                s.damping = 0.15;
                s.stiffness = 0.15;
                springs.push(s);
            }
            // we are looking each note supposing it doesn't exist in the notes array yet
            var lookingNote = chordnodes[i].midinotes[j]
            var noteExists = false;
            var index = 0; // keep track of its position if it exists
            for (var m = 0; m < nodes.length; m++) {
                if (lookingNote == (nodes[m].midinotes)) {
                    noteExists = true;
                    index = m; // si elle existe on le signale
                }
            }
            // if it exist we just link it with a spring to the chord
            if (noteExists) {
                var s = new Spring(chordnodes[i], nodes[index], noteSeries[nodes[index].midinotes[0]] * 45);
                s.damping = 0.15;
                s.stiffness = 0.15;
                springs.push(s);
            }
            else { // if it doesn't we creae a new note node and a spring
                var xpos = random(100, width - 100);
                var ypos = random(100, height - 100);
                nodes.push(new Node(xpos, ypos, chordnodes.length + nodes.length, chordnodes[i].midinotes[j], 50, chordnodes[i].midinotes[j], color(noteSeries[chordnodes[i].midinotes[j]] * 60 , 100, 100)));
                var s = new Spring(chordnodes[i], nodes[nodes.length - 1], noteSeries[nodes[index].midinotes[0]] * 45);
                s.damping = 0.15;
                s.stiffness = 0.15;
                springs.push(s);
            }
        }
    }
}

// a  function to sort an array by occurence
function sortA(arr) {
    var a = []
        , b = []
        , prev;
    arr.sort(); // sort alphabetically
    // build to arrays one with the values and one with the number of occurences
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== prev) {
            a.push(arr[i]);
            b.push(1);
        }
        else {
            b[b.length - 1]++;
        }
        prev = arr[i];
    }
    // format both array properly in one json object
    var result = {};
    for (var i = 0; i < a.length; i++) {
        for (var j = 0; j < b.length; j++) {
            if (i == j) {
                result[a[i]] = (b[j])
            }
        }
    }
    return result;
}

// change audio voice
function setBass(){
    soundBass = sp.getValuesAsJSON(false)["chord instrument"]
    ctx = getAudioContext();
    bass = Soundfont.instrument(ctx, soundBass);
}
// change audio voice
function setLead(){
     soundLead = sp.getValuesAsJSON(false)["lead instrument"]
    ctx = getAudioContext();
    lead = Soundfont.instrument(ctx, soundLead);
}
// list of available soundfonts
var instrumentTable = [
    "accordion"
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
