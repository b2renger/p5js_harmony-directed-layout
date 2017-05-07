// fix nexus 5 resolution
// look at device orientation
// find a way to ship soundfont to avoid loading time
// prevent refresh on pulling on mobile
// double fire up on chrome android
var nodes = []; // hold notes
var chordnodes = []; // hold chords
var springs = []; // old everything together
var nodesSize = 50;
var chordnodesSize = 75;
var ctx;
// soundfont stuff
var soundBass = new WebAudioFontPlayer();
var soundLead = new WebAudioFontPlayer();
var bass, lead
var chordOctave = 4;
var leadOctave = 5;
var chordDuration = 1.5;
var leadDuration = .5;
var chordVolume = 0.2;
var leadVolume = 0.5;
//  var chordProgression = "C, Dm, Em , F, GM7, Am";
var chordProgression = "C13, Dm, Em9 , Fm9b5";
// "overing" system
var selectedNode = null;
var lastSelectedNode = null;
var gui, sp, physics
var loading = false;
var font

function preload() {
    ctx = getAudioContext();
    for (var i = 0; i < soundfonts.length; i++) {
        soundBass.loader.startLoad(ctx, paths[i], soundfonts[i]);
        soundLead.loader.startLoad(ctx, paths[i], soundfonts[i]);
    }
    soundBass.loader.waitLoad(function () {
        console.log('done bass');
    })
    soundLead.loader.waitLoad(function () {
        console.log('done lead');
    })
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    smooth();
    frameRate(25);
    //textFont(font);
    // a drawer for general settings
    gui = QuickSettings.create(5, 5, 'General parameters')
    gui.addTextArea('chord progression', chordProgression, build);
    gui.addBoolean('physics', true)
    gui.addBoolean('move nodes', true)
    gui.addBoolean('sound on click', true)
    if (isTouchDevice()) {
        gui.addBoolean('sound on over', false)
    }
    else {
        gui.addBoolean('sound on over', true)
    }
    gui.setCollapsible(true)
        // a drawer for sound options
    sp = QuickSettings.create(210, 5, 'Sound Parameters')
    sp.addDropDown("chord instrument", avalaible_sounds, setBass);
    sp.addRange("chord octave", 1, 8, 4, 1, setChordOctave)
    sp.addRange("chord duration", 0.1, 8, 1.5, 0.01, setChordDuration)
    sp.addRange("chord volume", 0, 1, 0.2, 0.01, setChordVolume)
    sp.addDropDown("lead instrument", avalaible_sounds, setLead);
    sp.addRange("lead octave", 1, 8, 5, 1, setLeadOctave)
    sp.addRange("lead duration", 0.1, 8, 1.5, 0.01, setLeadDuration)
    sp.addRange("lead volume", 0, 1, 0.5, 0.01, setLeadVolume)
    sp.setCollapsible(true);
    sp.collapse(true);
    // a drawer for physics options
    physics = QuickSettings.create(415, 5, 'Physics Parameters')
    physics.addRange("note size", 25, 80, 50, 1, setNoteSize)
    physics.addRange("chord size", 50, 100, 75, 1, setChordSize)
    physics.addRange("damping", 0, 1, 0.5, 0.01, setDamping)
    physics.addRange("stiffness", 0, 1, 0.5, 0.01, setStifness)
    physics.addRange("length", 80, 220, 85, 1, setLength)
    physics.setCollapsible(true);
    physics.collapse(true);
    // build the network of chords and notes according to the chord progression
    build();
    selectedNode = chordnodes[0];
    lastSelectedNode = chordnodes[0];
    // print a list of all possible chords to be entered
    console.log(Tonal.chord.names())
}

function draw() {
    background(255);
    //console.log(soundLead.loader.zone.buffer)
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
                for (var j = i; j < nodes.length; j++) {
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
                for (var j = i; j < chordnodes.length; j++) {
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
    check_over_non_redundant(mouseX, mouseY);
}

function bassPlay(note, dur) {
    soundBass.queueWaveTable(ctx, ctx.destination, bass, 0, note, dur, chordVolume);
    return false;
}

function leadPlay(note, dur) {
    soundLead.queueWaveTable(ctx, ctx.destination, lead, 0, note, dur, leadVolume);
    return false;
}

function setBass() {
    var index = sp.getValuesAsJSON(false)["chord instrument"].index
        // console.log(soundfonts[index]);
        // bass = soundfonts[index];
        //    soundBass.loader.decodeAfterLoading(ctx, bass);
        //  soundBass.loader.startLoad(ctx, soundfonts[index], avalaible_sounds[index]);
        //				console.log(soundBass.loader.waitLoad())
}

function setLead() {
    var index = sp.getValuesAsJSON(false)["lead instrument"].index
    var leadname = soundfonts[index];
    var leadpath = paths[index];
    soundLead.loader.startLoad(ctx, leadpath, leadname);
    soundLead.loader.waitLoad(function () {
        console.log('done', this.name);
    })
    console.log('change', leadpath, leadname);
}
// gui callbacks
function setChordOctave() {
    if (sp.getValuesAsJSON(false)["chord octave"] != NaN) {
        chordOctave = sp.getValuesAsJSON(false)["chord octave"];
    }
}

function setChordDuration() {
    chordDuration = sp.getValuesAsJSON(false)["chord duration"];
}

function setChordVolume() {
    chordVolume = sp.getValuesAsJSON(false)["chord volume"];
}

function setLeadOctave() {
    if (sp.getValuesAsJSON(false)["lead octave"] != NaN) {
        leadOctave = sp.getValuesAsJSON(false)["lead octave"];
    }
}

function setLeadDuration() {
    leadDuration = sp.getValuesAsJSON(false)["lead duration"];
}

function setLeadVolume() {
    leadVolume = sp.getValuesAsJSON(false)["lead volume"];
}

function setNoteSize() {
    nodesSize = physics.getValuesAsJSON(false)["note size"]
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].diameter = nodesSize
    }
}

function setChordSize() {
    chordnodesSize = physics.getValuesAsJSON(false)["chord size"]
    for (var i = 0; i < chordnodes.length; i++) {
        chordnodes[i].diameter = chordnodesSize
    }
}

function setDamping() {
    for (var i = 0; i < springs.length; i++) {
        springs[i].damping = physics.getValuesAsJSON(false)["damping"]
    }
}

function setStifness() {
    for (var i = 0; i < springs.length; i++) {
        springs[i].stiffness = physics.getValuesAsJSON(false)["stiffness"]
    }
}

function setLength() {
    for (var i = 0; i < springs.length; i++) {
        springs[i].length = physics.getValuesAsJSON(false)["length"]
    }
}
// know if we handle a touch device or not
// http://stackoverflow.com/questions/6262584/how-to-determine-if-the-client-is-a-touch-device
function isTouchDevice() {
    var el = document.createElement('div');
    el.setAttribute('ongesturestart', 'return;'); // or try "ontouchstart"
    return typeof el.ongesturestart === "function";
}

function windowResized() {
    if (windowWidth > 620) {
        resizeCanvas(windowWidth, windowHeight);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].maxX = windowWidth
            nodes[i].maxY = windowHeight
        }
        for (var i = 0; i < chordnodes.length; i++) {
            chordnodes[i].maxX = windowWidth
            chordnodes[i].maxY = windowHeight
        }
    }
}
