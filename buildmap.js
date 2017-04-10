// this function builds a network of nodes linked by springs
// according to the chord progression
function build(params) {
    chordnodes = [];
    nodes = [];
    springs = [];
    chordProgression = gui.getValuesAsJSON(false)["chord progression"].split(",");
    // search for chords from chordProgression into our Table and create chord nodes for each of them
    var noteSeries = []; // we want to keep track of the notes for each chord.
    for (var j = 0; j < chordProgression.length; j++) {
        var c = chordProgression[j].trim();
        var xpos = random(width/2-200, width/2+200);
        var ypos = random(height/2-200, height/2 + 200);
        // add a new node to the chordnodes array
        chordnodes.push(new Node(xpos, ypos, chordnodes.length, c, 75, Tonal.chord(c), color(200, 100, 70)));
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
                var xpos =  chordnodes[i].location.x +  random(-100,  100);
                var ypos = chordnodes[i].location.x  + random(-100,   100);
                // new note
                nodes.push(new Node(xpos, ypos, chordnodes.length + nodes.length, chordnodes[i].midinotes[0], 50, chordnodes[i].midinotes[0], color(noteSeries[chordnodes[i].midinotes[0]] * 60, 80, 100)));
                // new spring
                var s = new Spring(chordnodes[i], nodes[0], noteSeries[nodes[0].midinotes[0]] * 100);
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
                var s = new Spring(chordnodes[i], nodes[index], noteSeries[nodes[index].midinotes[0]] * 75);
                s.damping = 0.15;
                s.stiffness = 0.15;
                springs.push(s);
            }
            else { // if it doesn't we creae a new note node and a spring
                var xpos =  chordnodes[i].location.x +  random(-100,  100);
                var ypos = chordnodes[i].location.x  + random(-100,   100);
                nodes.push(new Node(xpos, ypos, chordnodes.length + nodes.length, chordnodes[i].midinotes[j], 50, chordnodes[i].midinotes[j], color(noteSeries[chordnodes[i].midinotes[j]] * 60, 80, 100)));
                var s = new Spring(chordnodes[i], nodes[nodes.length - 1], noteSeries[nodes[index].midinotes[0]] * 75);
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
