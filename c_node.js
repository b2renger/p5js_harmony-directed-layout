  /* adapted from :
    // M_6_1_01.pde
    // Node.pde
    //
    // Generative Gestaltung, ISBN: 978-3-87439-759-9
    // First Edition, Hermann Schmidt, Mainz, 2009
    // Hartmut Bohnacker, Benedikt Gross, Julia Laub, Claudius Lazzeroni
    // Copyright 2009 Hartmut Bohnacker, Benedikt Gross, Julia Laub, Claudius Lazzeroni
    //
    // http://www.generative-gestaltung.de
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.
    */
  function Node(x, y, id, label, diam, notes, c) {
      // ------   properties ------
      // if needed, an ID for the node
      this.id = id;
      this.minX = 0;
      this.maxX = windowWidth;
      this.minY = 0;
      this.maxY = windowHeight;
      this.minZ = -60000;
      this.maxZ = 60000;
      this.location = createVector(x, y, 0);
      this.velocity = createVector(0, 0, 0);
      this.pVelocity = createVector(0, 0, 0);
      this.maxVelocity = 10;
      this.damping = 0.5;
      // radius of impact
      this.radius = diam*4;
      // strength: positive for attraction, negative for repulsion (default for Nodes)
      this.strength = 10;
      // parameter that influences the form of the function
      this.ramp = 1.0;
      this.c = c;
      this.diameter = diam; // to draw
      this.labl = label;
      this.midinotes = notes;
  }
  Node.prototype.attract = function (theNode) {
      var d = dist(this.location.x, this.location.y, theNode.location.x, theNode.location.y);
      if (d > 0 && d < this.radius) {
          var s = pow(d / this.radius, 1 / this.ramp);
          var f = s * 9 * this.strength * (1 / (s + 1) + ((s - 3) / 4)) / d;
          var df = p5.Vector.sub(this.location, theNode.location);
          df.mult(f);
          this.velocity.x += df.x;
          this.velocity.y += df.y;
          this.velocity.z += df.z;
      }
  }
  Node.prototype.update = function () {
      this.velocity.limit(this.maxVelocity);
      this.pVelocity.set(this.velocity);
      this.location.x += this.velocity.x;
      this.location.y += this.velocity.y;
      this.location.z += this.velocity.z;
      if (this.location.x < this.minX) {
          this.location.x = this.minX - (this.location.x - this.minX);
          this.velocity.x = -this.velocity.x;
      }
      if (this.location.x > this.maxX) {
          this.location.x = this.maxX - (this.location.x - this.maxX);
          this.velocity.x = -this.velocity.x;
      }
      if (this.location.y < this.minY) {
          this.location.y = this.minY - (this.location.y - this.minY);
          this.velocity.y = -this.velocity.y;
      }
      if (this.location.y > this.maxY) {
          this.location.y = this.maxY - (this.location.y - this.maxY);
          this.velocity.y = -this.velocity.y;
      }
      /*
      if (this.location.z < this.minZ) {
        this.location.z = this.minZ - (this.location.z - this.minZ);
        this.velocity.z = -this.velocity.z;
      }
      if (this.location.z > this.maxZ) {
        this.location.z = this.maxZ - (this.location.z - this.maxZ);
        this.velocity.z = -this.velocity.z;
      } */
      this.velocity.mult(1 - this.damping);
  }
  Node.prototype.display = function () {
      push();
      colorMode(HSB,360,100,100,100)
      noStroke();
      fill(0);
      ellipse(this.location.x, this.location.y, this.diameter / 5, this.diameter / 5);
      fill(hue(this.c),saturation(this.c), brightness(this.c), 45);
      ellipse(this.location.x, this.location.y, this.diameter, this.diameter);
      fill(0);
      textSize(15)
      textAlign(CENTER,BOTTOM)
      text(this.labl, this.location.x , this.location.y - this.diameter / 2 );
      pop();
  }
