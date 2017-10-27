// fix nexus 5 resolution
// remove some sounds
// add option to display midi notes
// fix effect chain
// add audio delay/feedback with editable loop time and volume and maybe other audio effects with tuna ? maybe  just a compressor ? a reverb ?
// add audio record button
var nodes = []; // hold notes
var chordnodes = []; // hold chords
var springs = []; // old everything together
var nodesSize = 75;
var chordnodesSize = 100;
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
var noteSpacing = 0.0;
var noteTimeout = 300;
//  var chordProgression = "C, Dm, Em , F, GM7, Am";
var chordProgression = "C7";
// "overing" system
var selectedNode = null;
var lastSelectedNode = null;
var gui, sp, physics
var loading = true;
var font;
var tuna;
var delay_effect;
var compressor;

function preload() {
    font = loadFont("assets/cafeandbrewery.ttf")
    ctx = getAudioContext();
    tuna = new Tuna(ctx);
    console.log('preload', ctx);
    for (var i = 0; i < 10; i++) {
        //console.log(i, avalaible_sounds.length, avalaible_sounds[i].name)
        soundBass.loader.startLoad(ctx, avalaible_sounds[i].path, avalaible_sounds[i].variable);
        soundLead.loader.startLoad(ctx, avalaible_sounds[i].path, avalaible_sounds[i].variable);
    }
    soundBass.loader.waitLoad(function () {
        //console.log('done bass');
        loading = false;
    })
    soundLead.loader.waitLoad(function () {
        // console.log('done lead');
        loading = false;
    })
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
    gui.addRange("notes timeout", 90, 2000, noteTimeout, 5, setNoteTimeout)
    gui.setCollapsible(true)
        // a drawer for sound options
    var dropDownNames = [];
    for (var i = 0; i < avalaible_sounds.length; i++) {
        dropDownNames.push(avalaible_sounds[i].name);
    }
    sp = QuickSettings.create(210, 5, 'Sound Parameters')
    sp.addDropDown("chord instrument", dropDownNames, setBass);
    sp.addRange("chord octave", 1, 8, 3, 1, setChordOctave)
    sp.addRange("chord duration", 0.1, 2, 1, 0.01, setChordDuration)
    sp.addRange("chord volume", 0, 0.25, 0.1, 0.01, setChordVolume)
    sp.addRange("notes spacing", 0, 0.5, noteSpacing, 0.01, setNoteSpacing)
    sp.addDropDown("lead instrument", dropDownNames, setLead);
    sp.addRange("lead octave", 1, 8, 3, 1, setLeadOctave)
    sp.addRange("lead duration", 0.1, 8, 1, 0.01, setLeadDuration)
    sp.addRange("lead volume", 0, 0.5, 0.25, 0.01, setLeadVolume)
    sp.setCollapsible(true);
    sp.collapse(true);
    // a drawer for physics options
    physics = QuickSettings.create(415, 5, 'Physics Parameters')
    physics.addRange("note size", 25, 80, nodesSize, 1, setNoteSize)
    physics.addRange("chord size", 50, 100, chordnodesSize, 1, setChordSize)
    physics.addRange("damping", 0, 1, 0.5, 0.01, setDamping)
    physics.addRange("stiffness", 0, 1, 0.5, 0.01, setStifness)
    physics.addRange("length", 100, 220, 150, 1, setLength)
    physics.setCollapsible(true);
    physics.collapse(true);
    // a drawer for audio post-processing
    aps = QuickSettings.create(620, 5, 'Audio Post-Processing')
        // sliders pour le délais
    aps.addRange("delay time", 100, 9000, 100, 1, function (val) {
        var newdel = val
        delay_effect.delayTime = newdel
    })
    aps.addRange("feedback", 0, 0.9, 0, 0.01, function (val) {
        var newfeedback = val
        delay_effect.feedback = newfeedback
    })
    aps.addButton("reset delay", function (val) {
            var olddel = aps.getValuesAsJSON(false)["delay time"]
            var oldfeedback = aps.getValuesAsJSON(false)["feedback"]
            delay_effect.delayTime = 0
            delay_effect.feedback = 0
            setTimeout(function () {
                delay_effect.delayTime = olddel
                delay_effect.feedback = oldfeedback
            }, olddel)
        })
        // build the network of chords and notes according to the chord progression
    build();
    selectedNode = chordnodes[0];
    lastSelectedNode = chordnodes[0];
    // print a list of all possible chords to be entered
    console.log(Tonal.chord.names())
        //set sounds
    sp.setValuesFromJSON({
        "lead instrument": 6
    })
    soundLead.loader.startLoad(ctx, avalaible_sounds[6].path, avalaible_sounds[6].variable);
    sp.setValuesFromJSON({
        "chord instrument": 6
    })
    soundBass.loader.startLoad(ctx, avalaible_sounds[6].path, avalaible_sounds[6].variable);
    // effect chain
    compressor = new tuna.Compressor({
        threshold: -1, //-100 to 0
        makeupGain: 1, //0 and up (in decibels)
        attack: 1, //0 to 1000
        release: 0, //0 to 3000
        ratio: 4, //1 to 20
        knee: 5, //0 to 40
        automakeup: true, //true/false
        bypass: 0
    });
    delay_effect = new tuna.Delay({
        feedback: 0.05, //0 to 1+
        delayTime: 100, //1 to 10000 milliseconds
        wetLevel: 0.5, //0 to 1+
        dryLevel: 0.5, //0 to 1+
        cutoff: 2500, //cutoff frequency of the built in lowpass-filter. 20 to 22050
        bypass: 0
    });
    delay_effect.disconnect();
    compressor.disconnect();
    compressor.connect(delay_effect);

    delay_effect.connect(p5.soundOut)

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
    if (touches.length < 2) {
        check_over(mouseX, mouseY);
    }
}

function touchStarted() {
    if (touches.length >= 2) {
        for (var i = 0; i < touches.length; i++) {
            check_over(touches[i].x, touches[i].y);
        }
    }
}

function touchMoved() {
    over_and_move();
    for (var i = 0; i < touches.length; i++) {
        check_over(touches[i].x, touches[i].y);
    }
}

function mouseMoved() {
    over_and_move();
    // overing the nodes
    check_over(mouseX, mouseY)
        // check_over_non_redundant(mouseX, mouseY);
}

function bassPlay(note, dur, delay) {
    //console.log('bassPlay',note,dur,bass);
    if (!(bass)) {
        bass = avalaible_sounds[0];
    }
    var t = ctx.currentTime + delay
    soundBass.queueWaveTable(ctx, compressor, window[bass.variable], t, note, dur, chordVolume);
    return false;
}

function leadPlay(note, dur) {
    //console.log('leadPlay',note,dur,lead);
    if (!(lead)) {
        lead = avalaible_sounds[0];
    }
    soundLead.queueWaveTable(ctx, compressor, window[lead.variable], 0, note, dur, leadVolume);
    return false;
}

function setBass() {
    loading = true;
    //console.log(loading)
    var index = sp.getValuesAsJSON(false)["chord instrument"].index
    soundBass.loader.startLoad(ctx, avalaible_sounds[index].path, avalaible_sounds[index].variable);
    soundBass.loader.waitLoad(function () {
        bass = avalaible_sounds[index];
        //console.log('bass',bass);
        loading = false
            //console.log(loading)
    })
}

function setLead() {
    loading = true;
    //console.log(loading)
    var index = sp.getValuesAsJSON(false)["lead instrument"].index
    soundLead.loader.startLoad(ctx, avalaible_sounds[index].path, avalaible_sounds[index].variable);
    soundLead.loader.waitLoad(function () {
        lead = avalaible_sounds[index];
        //console.log('lead',lead);
        loading = false
            //console.log(loading)
    })
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

function setNoteSpacing() {
    noteSpacing = sp.getValuesAsJSON(false)["notes spacing"];
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

function setNoteTimeout() {
    noteTimeout = gui.getValuesAsJSON(false)["notes timeout"]
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
