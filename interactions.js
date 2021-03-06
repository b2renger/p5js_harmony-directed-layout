function over_and_move() {
    if (gui.getValuesAsJSON(false)["move nodes"]) {
        if (touches.length > 0) {
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < nodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, nodes[j].location.x, nodes[j].location.y);
                    if (d < nodesSize / 2) {
                        nodes[j].location.x = touches[i].x
                        nodes[j].location.y = touches[i].y
                    }
                }
            }
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < chordnodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, chordnodes[j].location.x, chordnodes[j].location.y);
                    if (d < chordnodesSize / 2) {
                        chordnodes[j].location.x = touches[i].x
                        chordnodes[j].location.y = touches[i].y
                    }
                }
            }
        }
        else {
            for (var j = 0; j < nodes.length; j++) {
                var d = dist(pmouseX, pmouseY, nodes[j].location.x, nodes[j].location.y);
                if (d < nodesSize / 2) {
                    if (mouseIsPressed) {
                        nodes[j].location.x = mouseX
                        nodes[j].location.y = mouseY
                    }
                }
            }
            for (var j = 0; j < chordnodes.length; j++) {
                var d = dist(pmouseX, pmouseY, chordnodes[j].location.x, chordnodes[j].location.y);
                if (d < chordnodesSize / 2) {
                    if (mouseIsPressed) {
                        chordnodes[j].location.x = mouseX
                        chordnodes[j].location.y = mouseY
                    }
                }
            }
        }
    }
}

function check_over(mx, my) {
    // first check the note nodes
    for (var i = 0; i < nodes.length; i++) {
        var checkNode = nodes[i];
        var d = dist(mx, my, checkNode.location.x, checkNode.location.y);
        if (d < nodesSize / 2) {
            // selectedNode = checkNode; // this is the pb
            if (gui.getValuesAsJSON(false)["sound on click"]) {
                // we actually call the instrument right here
                if (!nodes[i].justPlayed) {
                    var noteToPlay = nodes[i].midinotes;
                    leadPlay(Tonal.midi.toMidi(noteToPlay + leadOctave), leadDuration);
                    nodes[i].justPlayed = true;
                    var n = nodes[i];
                    setTimeout(function (n) {
                            n.justPlayed = false;

                    }.bind(this, n), noteTimeout);
            }
        }
    }
}
// check the chord nodes
for (var i = 0; i < chordnodes.length; i++) {
    var checkNode = chordnodes[i];
    var d = dist(mx, my, checkNode.location.x, checkNode.location.y);
    if (d < chordnodesSize / 2) {
        // selectedNode = checkNode; //this is the pb
        if (gui.getValuesAsJSON(false)["sound on click"]) {
            if (!chordnodes[i].justPlayed) {
                var noteToPlay = chordnodes[i].midinotes;
                for (var j = 0; j < noteToPlay.length; j++) {
                    var note = noteToPlay[j] + chordOctave;
                    var time = j * noteSpacing;
                    bassPlay(Tonal.midi.toMidi(note), chordDuration, time)
                    chordnodes[i].justPlayed = true;
                    var n = chordnodes[i];
                    setTimeout(function (n) {
                            n.justPlayed = false;

                    }.bind(this, n), noteTimeout);
                }
            }
        }
    }
}
}
/*
function check_over_non_redundant(mx, my) {
    if (gui.getValuesAsJSON(false)["sound on over"]) {
        // first check the note nodes
        for (var i = 0; i < nodes.length; i++) {
            var checkNode = nodes[i];
            var d = dist(mx, my, checkNode.location.x, checkNode.location.y);
            if (d < nodesSize / 2) {
                selectedNode = checkNode;
                // play audio
                if (selectedNode.id != lastSelectedNode.id) { // if it not the same as precedent
                    lastSelectedNode = selectedNode;
                    var noteToPlay = selectedNode.midinotes;
                    leadPlay(Tonal.midi.toMidi(noteToPlay + leadOctave), leadDuration);
                }
            }
        }
        // check the chord nodes
        for (var i = 0; i < chordnodes.length; i++) {
            var checkNode = chordnodes[i];
            var d = dist(mx, my, checkNode.location.x, checkNode.location.y);
            if (d < chordnodesSize / 2) {
                selectedNode = checkNode;
                if (selectedNode.id != lastSelectedNode.id) {
                    lastSelectedNode = selectedNode;
                    var noteToPlay = selectedNode.midinotes;
                    for (var j = 0; j < noteToPlay.length; j++) {
                        var note = noteToPlay[j] + chordOctave;
                        var time = j *noteSpacing;
                        bassPlay(Tonal.midi.toMidi(note), chordDuration,time)
                    }
                }
            }
        }
    }
}*/
