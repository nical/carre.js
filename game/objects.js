Game.GameObjects = {

  firstLevel: 1,

  objects: {

    // Le joueur
    player : {
      displayComponent : Carre.DisplayComponents.Player,
      // Les "familles" auxquelles appartient le joueur.
      // très important pour définir le gameplay
      families : ["player", "physical", "killable"],
      // paramêtres pour la physique
      maxspeed : 6,
      friction : 1,
      // Des points de collisions avec le décor qui sont 
      // testés automatiquement
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
      // la boite englobante pour tester la collision avec d'autres GameObjects
      boundingBox : { x : 0, y : 0, width : 24, height : 67},
      // exécuté juste avant la destruction de l'objet
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
      // exécuté juste aprés la destruction de l'objet
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

    bonus : {
      displayComponent : Carre.DisplayComponents.Bonus,
      families: [ "bonus" ],
      noload: true
    },



    camera : {
      displayComponent : null,
      families : ["camera"],
    },



    timer: {
      displayComponent: Carre.DisplayComponents.Timer,
      families: [ "timer" ],
      value: 0
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
      displayComponent: Carre.DisplayComponents.LevelEnd,
      families: ["level_end"],
      boundingBox: {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
      }
    }
  }
}