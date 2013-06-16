Carre.GameLogic = {
  objectByFamily : {},
  objects : [],
  _eachFrame : [],
  world : {
    gravity :1,
    friction : 0.5
  },
  last_render_time : 0,
  last_footstep_sound_date : 0,
  last_footstep_sound : 0,

  eachFrame : function(action) {
    Carre.GameLogic._eachFrame.push(action);
  },

  onCollisionBetween : function logic_onCollisionBetween(classPair, action) {
    Carre.GameLogic.onBoxCollision(classPair[0], classPair[1]).push(action);
  },

  forEachObjectOfType : function logic_forEachObjectOfType(className, action) {
    Carre.GameLogic.eachFrame(
      function(elapsedTime) {
        var objList = Carre.GameLogic.get(className);
        if (!objList) return;
        for(var i = 0; i < objList.length; i++) {
          var obj = objList[i];
          action(obj, elapsedTime);
        }
      }
    );
  },

  isTouchingBackground : function logic_isTouchingBackground(obj, dir) {
    var cp = obj.collisionPoints;
    if (dir == "down")  { return cp.feet2.state >= 0; }
    if (dir == "up")    { return cp.head2.state >= 0; }
    if (dir == "left")  { return cp.left2.state >= 0; }
    if (dir == "right") { return cp.right2.state >= 0; }
  },

  isInsideBackground : function logic_isInsideBackground(obj, dir) {
    var cp = obj.collisionPoints;
    if (dir == "down")  { return cp.feet1.state >= 0; }
    if (dir == "up")    { return cp.head1.state >= 0; }
    if (dir == "left")  { return cp.left1.state >= 0; }
    if (dir == "right") { return cp.right1.state >= 0; }
  },

  ObjectTouchesCeiling : function(obj) {
    return obj.collisionPoints.head2.state >= 0;
  },

  create: function logic_createObject(name, desc) {
    var o = new GameObject( Util.extend({}, this.gameObjects[name], desc) );
    for (var i in o.families) {
      if (this.objectByFamily[o.families[i]] === undefined) {
        this.objectByFamily[o.families[i]] = [];
      }
      this.objectByFamily[o.families[i]].push(o);
    }
    this.objects.push(o);
    return o;
  },

  get: function(family) {
    if (this.objectByFamily[family] === undefined || this.objectByFamily[family] === null) {
      this.objectByFamily[family] = [];
    }
    return this.objectByFamily[family];
  },

  getAllObjectsOfType: function logic_getAllObjectsOfType(className) {
    return Carre.GameLogic.get(className);
  },

  getFirstObjectOfType: function logic_getFirstObjectsOfType(className) {
    var list = Carre.GameLogic.get(className);
    if (list.length) {
      return list[0];
    }
    return null;
  },

  onKeyPressed : function logic_onKeyPressed(keyName, action) {
    Carre.Inputs.register.bind(Carre.Inputs)(Carre.Inputs.keyMapping[keyName], "down", "sync", action)
  },

  onKeyReleased : function logic_onKeyReleased(keyName, action) {
    Carre.Inputs.register.bind(Carre.Inputs)(Carre.Inputs.keyMapping[keyName], "up", "sync", action)
  },

  whileKeyIsDown : function logic_whileKeyIsDown(keyName, action) {
    Carre.Inputs.register.bind(Carre.Inputs)(Carre.Inputs.keyMapping[keyName], "down", "async", action)
  },

  // Used when changing the level : remove all the object from the world.
  // Use this only when the event loop is stopped.
  cleanWorld : function() {
    this.objectByFamily = {};
    this.objects = [];
  },
  shouldTriggerFootstepSound : function() {
    var interval = Date.now() - this.last_footstep_sound_date;
    if (interval > 150) {
      this.last_footstep_sound_date = Date.now();
      return true;
    }
    return false;
  },
  placeGameObjects : function() {
    var player = this.create("player"),
        camera = this.create("camera"),
        timer = this.create("timer");

    // load a first particle
    this.create("particle", {opacity: 0});
  },

  // holds the box collision results
  boxCollisions : {},

  onBoxCollision : function(f1, f2) {
    if ( !this.boxCollisions[f1]){
      this.boxCollisions[f1] = {};
      this.boxCollisions[f1][f2] = []
    }
    else if (!this.boxCollisions[f1][f2]){
      this.boxCollisions[f1][f2] = [];
    }
    return this.boxCollisions[f1][f2];
  },

  processBoxCollisions : function logic_processBoxCollisions(elapsedTime) {
    var objByFamily = this.objectByFamily;
    for( var f1 in this.boxCollisions ){
      for( var i1 = 0; i1 < this.get(f1).length;++i1 ){
        for( var f2 in this.boxCollisions[f1] ){
          for( var i2 = 0; i2 < this.get(f2).length;++i2 ){
            var b1 = { width:objByFamily[f1][i1].boundingBox.width
                , height:objByFamily[f1][i1].boundingBox.height},
                b2 = {width:objByFamily[f2][i2].boundingBox.width
                , height:objByFamily[f2][i2].boundingBox.height};
            b1.x = objByFamily[f1][i1].x;
            b1.y = objByFamily[f1][i1].y;
            b2.x = objByFamily[f2][i2].x;
            b2.y = objByFamily[f2][i2].y;
            if( this.boxCollisionTest( b1, b2 ) ){
              this.boxCollisions[f1][f2].forEach(function(cb){
                cb( objByFamily[f1][i1], objByFamily[f2][i2], elapsedTime );
              });
            }
          }
        }
      }
    }
  },

  boxCollisionTest : function logic_boxCollisionTest( box1, box2 ) {
      var ax1 = box1.x,
          ax2 = box1.x + box1.width,
          bx1 = box2.x,
          bx2 = box2.x + box2.width,
          ay1 = box1.y,
          ay2 = box1.y + box1.height,
          by1 = box2.y,
          by2 = box2.y + box2.height;
      return (
          (ax2 > bx1) && (bx2 > ax1)
          &&(ay2 > by1) && (by2 > ay1)
      );
  },

  isGrounded : function(gameObject){
    if(gameObject.collisionPoints && gameObject.collisionPoints.feet2){
        return (gameObject.collisionPoints.feet2.state >= 0)
    } else return false;
  },

  variables : {
      groundedTime : 0,
      groundedTimeThreshold : 200
  },

  init : function() {

  },

  gameObjects : {
    player : {
      displayComponent : Carre.DisplayComponents.Player,
      families : ["player", "physical", "killable"],
      x : 32,
      y : 110,
      collisionPoints : {
        feet1 : {x : 45, y : 62, state : false},
        feet2 : {x : 45, y : 66, state : false},
        head1 : {x : 45, y : 33, state : false},
        head2 : {x : 45, y : 27, state : false},
        left1 : {x : 31, y : 45, state : false},
        left2 : {x : 25, y : 45, state : false},
        right1 : {x : 58, y : 45, state : false},
        right2 : {x : 64, y : 45, state : false}
      },
      boundingBox : { x : 0, y : 0, width : 24, height : 67},
      maxspeed : 5,
      friction : 1,
      onBeforeDestroy : function(gameObject) {
        Carre.Sound.trigger("death");

        if (Carre.settings.quality === "HQ") {
          var i = 100,
            p = gameObject,
            head = p.collisionPoints.head1;
          while ( i-- ) {
            Carre.GameLogic.create("particle", {
              x: p.x + head.x + Math.round(Math.random() * 16 * Util.randomDirection()),
              y: p.y + head.y + 10 + Math.round(Math.random() * 8 * Util.randomDirection()),
              vy: (2 + Math.random() * 20) * Util.randomDirection(),
              vx: (2 + Math.random() * 20) * Util.randomDirection(),
              width: 24,
              height: 24,
              look: p.look,
              noload: true
            });
          }
        }

      },
      onAfterDestroy : function() {
          var player = Carre.GameLogic.create("player");
          player.vx = player.vy = 0;
          Carre.GameLogic.objectByFamily.timer[0].loadLevelTime = Date.now();
      }
    },
    particle : {
      displayComponent : Carre.DisplayComponents.Particle,
      families: [ "particle" ]
    },
    camera : {
      displayComponent : null,
      families : ["camera"],
      //boundingBox : { x : 0, y : 0, width : 24, height : 67},
      x : 0,
      y : 0
    },
    timer: {
      displayComponent: Carre.DisplayComponents.Timer,
      families: [ "timer" ]
    },
    bumper_up : {
      displayComponent : Carre.DisplayComponents.Bumper,
      families :  ["bumper"],
      type: "up"
    },
    bumper_left : {
      displayComponent : Carre.DisplayComponents.Bumper,
      families :  ["bumper"],
      type: "left"
    },
    bumper_right : {
      displayComponent : Carre.DisplayComponents.Bumper,
      families :  ["bumper"],
      type: "right"
    },
    level_end: {
      x: 0,
      y: 0,
      displayComponent: Carre.DisplayComponents.LevelEnd,
      families: ["level_end"],
      boundingBox: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
      }
    }
  },
  render : function logic_render(c) {
    var _this = this,
        physical = this.objectByFamily.physical;

    var now = Date.now();
    if (this.last_render_time === 0) {
      this.last_render_time = now - 10;
    }
    var elapsedTime = this.elapsedTime = now - this.last_render_time;
    // precomute all point collisions
    for (var o = 0; o < physical.length; o++) {
      for(var cp in physical[o].collisionPoints) {
        physical[o].collisionPoints[cp].state = this.testCollision(
          physical[o].x + physical[o].collisionPoints[cp].x,
          physical[o].y + physical[o].collisionPoints[cp].y,
          Carre.Tile.layers.solid,
          Carre.Tile.solidMapData
        );
      }
    }
    // precompute all boxCollisions
    this.processBoxCollisions(elapsedTime);


    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].displayComponent) {
        this.objects[i].displayComponent.display.bind(this.objects[i].displayComponent)(this.objects[i], c, elapsedTime);
      }
    }
    if (this._eachFrame) {
      this._eachFrame.forEach(function(f) {
        if (Carre.wasPaused) {
          f(16);
        } else {
          f(elapsedTime);
        }
      });
      Carre.wasPaused = false;
    }
    this.last_render_time = now;
  },
  testCollision : function logic_testMapCollision(x, y, layer, mapData) {
    var tx = Math.floor(x / Carre.Tile.map.tilewidth),
        ty = Math.floor(y / Carre.Tile.map.tileheight),
        id = tx + ty * layer.width,
        tId = layer.data[id],
        tileData = mapData[id];
    if (typeof tId !== "undefined" && tId !== 0 &&
        tx >= 0 && ty >= 0 &&
        tx <= layer.width && ty <= layer.height) {
      return tileData.color;
    }
    return -1;
  }
};
