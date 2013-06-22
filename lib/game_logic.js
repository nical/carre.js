function GameObject(desc) {
  // TODO make this better because it sucks.
  //~ for (attr in desc) {
    //~ if (desc.hasOwnProperty(attr)) {
      //~ this[attr] = desc[attr];
    //~ }
  //~ }
  this.x = desc.x || 0;
  this.y = desc.y || 0;
  this.vx = desc.vx || 0;
  this.vy = desc.vy || 0;
  this.width = desc.width;
  this.height = desc.height;
  this.opacity = desc.opacity || 1;
  this.look = desc.look || "right";
  this.displayComponent = desc.displayComponent || null;
  this.families = desc.families || [];
  this.collisionPoints = desc.collisionPoints || {};
  this.friction  = desc.friction || 1;
  this.maxspeed = desc.maxspeed || 5;
  this.onBeforeDestroy = desc.onBeforeDestroy;
  this.onAfterDestroy = desc.onAfterDestroy;
  this.destroyCallback = desc.destroyCallback;
  this.boundingBox = desc.boundingBox || {x:0,y:0,width:32,height:32};
  this.type = desc.type || null;
  if (this.displayComponent && !desc.noload) {
    this.displayComponent.load.bind(this.displayComponent)();
  }
}

GameObject.prototype.destroy = function() {
  if (this.onBeforeDestroy) {
    this.onBeforeDestroy(this);
  }

  var index = Carre.GameLogic.objects.indexOf(this);
  var _this = this,
      o = Carre.GameLogic.objects.splice(index, 1);
  this.families.forEach(function (e) {
    var i = Carre.GameLogic.objectByFamily[e].indexOf(_this);
    Carre.GameLogic.objectByFamily[e].splice(i, 1);
  });

  if (this.onAfterDestroy) {
    this.onAfterDestroy(this);
  }
};

Carre.GameLogic = {
  objectByFamily : {},
  objects : [],
  _eachFrame : [],
  _levelStart : [],
  isLevelStart : true,
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

  onLevelStart : function(action) {
    Carre.GameLogic._levelStart.push(action);
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
    this.create("bonus", {opacity: 0});
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
            b1.x = objByFamily[f1][i1].x + objByFamily[f1][i1].boundingBox.x;
            b1.y = objByFamily[f1][i1].y + objByFamily[f1][i1].boundingBox.y;
            b2.x = objByFamily[f2][i2].x + objByFamily[f2][i2].boundingBox.x;
            b2.y = objByFamily[f2][i2].y + objByFamily[f2][i2].boundingBox.y;
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
    Carre.GameLogic.gameObjects = Game.GameObjects.objects;
  },

  render : function logic_render(c) {
    var _this = this;
    var physical = this.objectByFamily.physical;

    if (Carre.GameLogic.isLevelStart) {
      for (var l in Carre.Tile.map.layers) {
        if (Carre.Tile.map.layers[l].name === "bonus") {
          for (var b in Carre.Tile.map.layers[l].objects) {
            var bon = Carre.Tile.map.layers[l].objects[b];
            Carre.GameLogic.create("bonus", {x:bon.x, y:bon.y,
                                             width:48, height:48,
                                             noload:true});
          }
        }
      }
      Carre.GameLogic.isLevelStart = false;
    }

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
