Game.Gameplay = {
// ---------------------------------------------------------------------------
// Cette fonction est exécutée au début du jeu. Elle initialise les règles
// qui constituent le "game-play".
init : function gpp_init() {
// Pour commencer directement à un autre niveau, modifiez la valeur ci-dessous
Carre.currentLevel = 0;

// 
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------



// ----------------------------------------------------------------------------
// mettre le jeu en pause
// ----------------------------------------------------------------------------
Carre.GameLogic.onKeyPressed("pause",
    function gpp_keyPause(elapsedTime) {
      Carre.paused = !Carre.paused;
    }
);

// ----------------------------------------------------------------------------
// Se déplacer vers la gauche ou la droite (joueur)
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("player",
    function gpp_inputsLeftRight(player, elapsedTime) {
        if (Carre.Inputs.isKeyDown("left")) {
            if (player.isWallGrinding != true) {
                player.look = "left";
            }
            if (!Carre.GameLogic.isTouchingBackground(player, "left")) {
                player.vx = Math.max(player.vx - 0.08 * elapsedTime, - player.maxspeed);
                player.displayComponent.animation.currentAnimation = player.displayComponent.animation.walking;
            }
        }
        if (Carre.Inputs.isKeyDown("right")) {
            if(player.isWallGrinding !== undefined && !player.isWallGrinding){
                player.look = "right";
            }
            if (!Carre.GameLogic.isTouchingBackground(player, "right")) {
                player.vx = Math.min(player.vx + 0.08 * elapsedTime, player.maxspeed);
                player.displayComponent.animation.currentAnimation = player.displayComponent.animation.walking;
            }
        }
    }
);
// ----------------------------------------------------------------------------
// Sauter (joueur)
// ----------------------------------------------------------------------------
var jump = function gpp_jump(player, elapsedTime) {
    if (Carre.GameLogic.isTouchingBackground(player, "down")) {
        player.vy = -15;
        Carre.Sound.trigger("jump");
    }
/*
     else if (Carre.GameLogic.isTouchingBackground(player, "right") &&
               !Carre.GameLogic.isTouchingBackground(player, "down")) {
        player.vy = -16;
        player.vx = -10;
        Carre.Sound.trigger("walljump");
    } else if (Carre.GameLogic.isTouchingBackground(player, "left") &&
               !Carre.GameLogic.isTouchingBackground(player, "down")) {
        player.vy = -16;
        player.vx = 10;
        Carre.Sound.trigger("walljump");
    }
*/
}
// au moment de l'appui sur fleche du haut
Carre.GameLogic.onKeyPressed("up",
    function (elapsedTime) {
        var player = Carre.GameLogic.getFirstObjectOfType("player");
        if (player) {
            jump(player, elapsedTime);
        }
    }
);

// au moment de l'appui sur la touche action1 (barre d'espace)
Carre.GameLogic.onKeyPressed("action1",
    function (elapsedTime) {
        var player = Carre.GameLogic.getFirstObjectOfType("player");
        if (player) {
            jump(player, elapsedTime);
        }
    }
);

// ----------------------------------------------------------------------------
// tremplins
// ----------------------------------------------------------------------------
// condition: lors d'une collision...
Carre.GameLogic.onCollisionBetween(
//            ...entre objet de type player et un objet de type bumper
    ["player", "bumper"],
// action: propulse le player vers le haut, la gauche ou la droite
//         en lui imposant une vitesse
    function gpp_bumper(objPlayer, objBumper, elapsed){
        if (objBumper.type === "up") {
            objPlayer.vy = -50;
        }
        else if (objBumper.type === "left") {
            objPlayer.vx = -50;
        }
        else if (objBumper.type === "right") {
            objPlayer.vx = 50;
        }
    }
);

// ----------------------------------------------------------------------------
// bonus
// ----------------------------------------------------------------------------
Carre.GameLogic.onCollisionBetween(
//            ...entre objet de type player et un objet de type bumper
    ["player", "bonus"],
// action: propulse le player vers le haut, la gauche ou la droite
//         en lui imposant une vitesse
    function gpp_bumper(player, bonus, elapsed){
        player.vy = -12;
        bonus.destroy.bind(bonus)();
    }
);



// ----------------------------------------------------------------------------
// fin du niveau
// ----------------------------------------------------------------------------
Carre.GameLogic.onCollisionBetween( ["player", "level_end"],
  function gpp_endLevel(objPlayer, objEnder, elapsed) {
    //alert("Foo!");
    Carre.levelWon();
  }
);


// ----------------------------------------------------------------------------
// collisions avec le décor
// ----------------------------------------------------------------------------
// pour chaque objet "obj" de type "physical"
Carre.GameLogic.forEachObjectOfType("physical",
    function gpp_computePhysics(obj, elapsedTime) {
        // applique la gravité en augmentant la vitesse vers le bas
        obj.vy += Carre.GameLogic.world.gravity * (elapsedTime/16);

        // stoppe l'objet s'il touche le décors
        if (obj.vy > 0 && Carre.GameLogic.isTouchingBackground(obj, "down"))   { obj.vy = 0; }
        if (obj.vy < 0 && Carre.GameLogic.isTouchingBackground(obj, "up"))     { obj.vy = 0; }
        if (obj.vx < 0 && Carre.GameLogic.isTouchingBackground(obj, "left"))   { obj.vx = 0; }
        if (obj.vx > 0 && Carre.GameLogic.isTouchingBackground(obj, "right"))  { obj.vx = 0; }

        // Si l'objet est dans le décors, il faut le décoincer
        if (Carre.GameLogic.isInsideBackground(obj, "down"))  { obj.y -= 4 * (elapsedTime / 16); }
        if (Carre.GameLogic.isInsideBackground(obj, "left"))  { obj.x += 4 * (elapsedTime / 16); }
        if (Carre.GameLogic.isInsideBackground(obj, "right")) { obj.x -= 4 * (elapsedTime / 16); }

        obj.x += obj.vx * (elapsedTime / 16);
        obj.y += obj.vy * (elapsedTime / 16);
    }
);

// ----------------------------------------------------------------------------
// Bruits de pas du joueur
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("player",
    function gpp_computePlayerSound(player, elapsedTime) {
        var cp = player.collisionPoints;
        var collision;

        collision = cp.head2.state >= 0 ? "head" :
          cp.right2.state >= 0 ? "right" :
          cp.feet2.state >= 0 ? "feet" :
          cp.left2.state >= 0 ? "left" : false;
        player.collided = collision != player.lastCollision && collision;
        player.lastCollision = collision;

        if (cp.feet2.state >= 0 && Carre.GameLogic.shouldTriggerFootstepSound() && Math.abs(player.vx) > 0) {
          var soundName = "step" + Carre.GameLogic.last_footstep_sound;
          Carre.GameLogic.last_footstep_sound = (Carre.GameLogic.last_footstep_sound + 1) % 2;
          Carre.Sound.trigger(soundName);
        }
    }
);

// ----------------------------------------------------------------------------
// Wall grind
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("player",
    function gpp_computeWallJump(player, elapsedTime) {
        if (player.collisionPoints.right2.state >= 0 && Carre.Inputs.isKeyDown("right")) {
          player.vy = Math.min(player.vy, 2);
          player.look = "left";
          player.displayComponent.animation.currentAnimation = player.displayComponent.animation.jump_up;
          player.isWallGrinding = true;
        } else if (player.collisionPoints.left2.state >= 0 && Carre.Inputs.isKeyDown("left")) {
          player.vy = Math.min(player.vy, 2);
          player.look = "right";
          player.displayComponent.animation.currentAnimation = player.displayComponent.animation.jump_up;
          player.isWallGrinding = true;
        } else {
          player.isWallGrinding = false;
        }
    }
);

// ----------------------------------------------------------------------------
// Mort d'un objet quand il tombe du niveau
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("killable",
    function gpp_computeKillable(obj, elapsedTime) {
        if (obj.y > Carre.Tile.levelBottom || obj.kill) {
            obj.destroy.bind(obj)();
        }
    }
);

// ----------------------------------------------------------------------------
// Animations du joueur
// ----------------------------------------------------------------------------
// Animation jump
Carre.GameLogic.forEachObjectOfType("player",
    function gpp_ComputePlayerAnimations(player, elapsedTime) {
        if (!player.isWallGrinding){
            if (player.vy > 1){
                player.displayComponent.animation.currentAnimation = player.displayComponent.animation.jump_down;
            } else if (player.vy < -1) {
                player.displayComponent.animation.currentAnimation = player.displayComponent.animation.jump_up;
            }
        }
    }
);

// ----------------------------------------------------------------------------
// Camera
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("camera",
    function gpp_computeCamera(camera, elapsedTime) {
        var player = Carre.GameLogic.getFirstObjectOfType("player");
        if (!player) { return; }
        // Ditance entre la camera et le joueur
        var dx = camera.x + Carre.settings.width / 2  - player.x ;
        var dy = camera.y + Carre.settings.height / 2 - player.y ;
        // Rapproche la camera du joueur, d'un 1/10 de la distance pour que la 
        // vitesse de la camera soir rapide quand elle est loin et lente quand 
        // elle est près du joueur
        camera.x -= Math.floor(dx / 10);
        camera.y -= Math.floor(dy / 10);
    }
);

// ----------------------------------------------------------------------------
// Inertie du joueur
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("player",
    function gpp_computeInertia(player, elapsedTime) {

        // calcule et applique la friction
        if (player.collisionPoints.feet2.state >= 0) {
            if (player.vx !== 0) {
                var direction = player.vx > 0 ? -1 : 1,
                    dx = Carre.GameLogic.world.friction * player.friction * direction;
                player.vx += dx;
                if (player.vx * player.vx < 0.5) {
                    player.vx = 0;
                    player.displayComponent.animation.currentAnimation = player.displayComponent.animation.idle;
                }
            }
        }

        // fixe l'annimation en cours à "arret" si la vitesse horizontale est faible
        if ((Math.abs(player.vx) < 0.1) && (Math.abs(player.vy) < 0.1)) {
            player.displayComponent.animation.currentAnimation = player.displayComponent.animation.idle;
        }

        // crée 10 particles si une collision vient d'avoir lieu
        if (Carre.settings.quality === "HQ") {
            var i = 10;
            if (player.collided) {
              while ( i-- ) { Util.addParticle( Carre.GameLogic, player ); }

            // create approx 1 particle every 5 frames otherwise
            } else if (Math.random() * 5 > 4) {
              Util.addParticle(Carre.GameLogic, player);
            }
        }
    }
);

// ----------------------------------------------------------------------------
// Comportement des particules
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("particle",
    function gpp_computeParticles(prt, elapsedTime) {
        prt.x += prt.vx;
        prt.y += prt.vy;

        prt.vy -= .0125;
        prt.width -= .25;
        prt.height -= .25;
        prt.opacity -= .0125;

        if ( prt.opacity < .05 ) {
          prt.destroy();
        }
    }
);

// ----------------------------------------------------------------------------
// Compteur de temps
// ----------------------------------------------------------------------------
Carre.GameLogic.forEachObjectOfType("timer",
    function gpp_updateTimer(timer, elapsedTime)
    {
        timer.value = (+new Date - timer.loadLevelTime) / 1000;
    }
);

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
}, // init
};