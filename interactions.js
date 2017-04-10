
function over_and_play() {
    // move the nodes with the mouse

    console.log("passing though");
    if (gui.getValuesAsJSON(false)["sound"]) {
        console.log(touches);
        if (touches.length != 0) {
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < nodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, nodes[j].location.x, nodes[j].location.y);
                    if (d < 50) {
                        lead.then(function (inst) {
                            var noteToPlay = nodes[j].midinotes;
                            console.log("midinotes lead", noteToPlay);
                            inst.play(noteToPlay + 3, 0, {
                                loop: false
                            });
                        });
                    }
                }
            }
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < chordnodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, chordnodes[j].location.x, chordnodes[j].location.y);
                    if (d < 50) {
                        bass.then(function (inst) {
                            var noteToPlay = nodes[j].midinotes;
                             console.log("midinotes bass", noteToPlay);
                            for (var k = 0; k < noteToPlay.length; k++) {
                                var note = noteToPlay[k];
                                inst.play(note + 3, 0, {
                                    loop: false
                                });
                            }
                        });
                    }
                }
            }
        }
        else {
            console.log("click");
            for (var j = 0; j < nodes.length; j++) {
                var d = dist(mouseX, mouseY, nodes[j].location.x, nodes[j].location.y);
                if (d < 50) {
                    lead.then(function (inst) {
                        var noteToPlay = lastSelectedNode.midinotes;
                         console.log("midinotes lead", noteToPlay);
                        inst.play(noteToPlay + 3, 0, {
                            loop: false
                        });
                    });
                }
            }
            for (var j = 0; j < chordnodes.length; j++) {
                var d = dist(mouseX, mouseY, chordnodes[j].location.x, chordnodes[j].location.y);
                if (d < 50) {
                    bass.then(function (inst) {
                        var noteToPlay = lastSelectedNode.midinotes;
                         console.log("midinotes bass", noteToPlay);
                        for (var j = 0; j < noteToPlay.length; j++) {
                            var note = noteToPlay[j];
                            inst.play(note + 3, 0, {
                                loop: false
                            });
                        }
                    });
                }
            }
        }
    }
}

function over_and_move() {
    if (gui.getValuesAsJSON(false)["move nodes"]) {
        if (touches.length != 0) {
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < nodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, nodes[j].location.x, nodes[j].location.y);
                    if (d < 50) {
                        nodes[j].location.x = touches[i].x
                        nodes[j].location.y = touches[i].y
                    }
                }
            }
            for (var i = 0; i < touches.length; i++) {
                for (var j = 0; j < chordnodes.length; j++) {
                    var d = dist(touches[i].x, touches[i].y, chordnodes[j].location.x, chordnodes[j].location.y);
                    if (d < 50) {
                        chordnodes[j].location.x = touches[i].x
                        chordnodes[j].location.y = touches[i].y
                    }
                }
            }
        }
        else {
            if(mouseIsPressed){
            for (var j = 0; j < nodes.length; j++) {
                var d = dist(mouseX, mouseY, nodes[j].location.x, nodes[j].location.y);
                if (d < 50) {
                    nodes[j].location.x = mouseX
                    nodes[j].location.y = mouseY
                }
            }
            for (var j = 0; j < chordnodes.length; j++) {
                var d = dist(mouseX, mouseY, chordnodes[j].location.x, chordnodes[j].location.y);
                if (d < 50) {
                    chordnodes[j].location.x = mouseX
                    chordnodes[j].location.y = mouseY
                }
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
                        inst.play(noteToPlay + 3, 0, {
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
                            inst.play(note + 3, 0, {
                                loop: false
                            });
                        }
                    });
                }
            }
        }
    }
}
