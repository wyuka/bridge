'use strict';

function Repository() {
}

Repository.prototype = {

  getElementsByCategory: function(category) {
      return this[category];
  },

  getCategorySize: function(category) {
    if (this.hasOwnProperty(category)) {
      return this[category].length;
    } else {
      return 0;
    }
  },

  clearCategory: function(category) {
      this[category] = [];
  },

  createIfEmpty: function(category) {
    if (!(this.hasOwnProperty(category))) {
      this[category] = [];
    }
  },

  findElement: function(id, category) {
    var allElements = this.getElementsByCategory(category);
    var element =  _.find(allElements, function(e) { return e.data("id") == id; }); 
    return element;
  },

  removeElementFromCategory: function(id, category) {
    var allElements = this[category];
    var element =  _.find(allElements, function(e) { return e.data("id") == id; }); 
    this[category] = _.without(allElements, element);
    return element;
  },

  addElement: function(element, id, category) {
    this.createIfEmpty(category);
    element.data("id", id);
    this[category].push(element);
  }
};
function TextTask(element, text) {
    this.element = element;
    this.text = text;
    this.type = "TextTask";
};

TextTask.prototype = new AsyncTask;
TextTask.prototype.run = function() {
        //this.element.hide();
        this.element.attr({'text': this.text});
        this.element.attr({'opacity': '1','fill': '#fff'});
        this.finish();
};

function AnimationTask(element, attr, time, callback) {
  this.element = element;
  this.type = "AnimationTask";
  this.attr = attr;
  this.time = time;
  this.callback = callback;
};

AnimationTask.prototype = new AsyncTask;
AnimationTask.prototype.run = function() {
      var self = this;
      var compositeCallback = function () {
        if (self.callback) {
          self.callback.apply(this);
        }
        self.finish();
      };
      var animation = Raphael.animation(this.attr, this.time, ">", compositeCallback);
      try {
        this.element.show().stop().animate(animation);
      } catch (err) {
          console.log("error with animation");
      }
};

function CompositeAnimationTask(animationList) {
  this.animationList = animationList;
  this.type = "CompositeAnimationTask";
  this.animCount = animationList.length;
  this.finishedAnimCount = 0;
};

CompositeAnimationTask.prototype = new AsyncTask;
CompositeAnimationTask.prototype.run = function() {
      var self = this;

      var i;
      for (i in self.animationList) {
        var currAnim = self.animationList[i];
        var compositeCallback = function () {
          if (currAnim.callback) {
            currAnim.callback.apply(this);
            self.finishedAnimCount += 1;
            //console.debug("finishedAnimCount updated by ["+i+"] to ["+self.finishedAnimCount+"]" + " limit ["+self.animCount+"]");
            if (self.finishedAnimCount == self.animCount) {
              //console.debug("finishing composite anim by ["+i+"]" );
              self.finish();
            }
          }
        };
        var animation = Raphael.animation(currAnim.attr, currAnim.time, ">", compositeCallback);
        currAnim.element.show().stop().animate(animation);
      }
};

function View(game) {
    this.game = game;
    this.canvas = new Raphael('canvas', constants.WIDTH, constants.HEIGHT);
    this.auxilCanvas = new Raphael('auxilCanvas', constants.AUXIL_WIDTH, constants.AUXIL_HEIGHT);
    this.repository = new Repository();
    this.taskQueue = new TaskQueue();
    this.splashVisible = false;
}

View.prototype = {

    setGame: function(game) {
      this.game = game;
    },

    getCanvas: function() {
      return this.canvas;
    },

    getAuxilCanvas: function() {
      return this.auxilCanvas;
    },

    getRepository: function() {
      return this.repository;
    },

    preload: function() {
      this.drawProgressOverlay();
      var loader = this.initPxLoader(); 
      loader.start();
    },

    askPlayerName: function(callback) {
      var self = this;

      $('#welcomeModal').modal('show');
      $('#closePlayerName').click(function(event) {
        event.preventDefault();
        callback('');
        $('#welcomeModal').modal('hide');
        self.showSplash();
      });
      $('#formPlayerName').submit(function(event) {
        event.preventDefault();
        var playerName =  $('#inputPlayerName').val();
        callback(playerName);
        $('#welcomeModal').modal('hide');
        self.showSplash();
      });
    },

    handleCallClicked: function (img) {
        console.log("number = " + img.data("number") + "\nsuit = " + img.data("suit"));
    },

    suitNumberToString: function(num) {
        var list = ['CLUBS', 'DIAMONDS', 'HEARTS', 'SPADES', 'NOTRUMP'];
        return list[num];
    },

    drawButton: function(number, suit, x, y, width, height) {
        var self = this;
        var clubsImageFile = this.getSuitImageFile('CLUBS');
        var diamondsImageFile = this.getSuitImageFile('DIAMONDS');
        var heartsImageFile = this.getSuitImageFile('HEARTS');
        var spadesImageFile = this.getSuitImageFile('SPADES');
        var noTrumpImageFile = this.getSuitImageFile('NOTRUMP');
        var suitImages = [clubsImageFile, diamondsImageFile, heartsImageFile, spadesImageFile, noTrumpImageFile];

        var img = suitImages[suit];

        var canvas = this.getCanvas();
        img = canvas.image(img, x, y, width, height);

        img.data("suit", suit);
        img.data("number", number);

        img.mouseover(function(event) {
            try {
                this.transform('s1.1');
            } catch (err) {}
        });
        img.mouseout(function(event) {
            try {
                this.transform('s0.9091');
                self.clearError();
            } catch (err) {}
        });
        img.click(function(event) {
            var callNumber = this.data("number");
            var callSuit = this.data("suit");
            console.log("clicked on number = " + callNumber + ", suit = " + callSuit);
            self.game.makeCall(callNumber, callSuit);
        });
        return img;
    },

    drawCallNumber: function(callNumber, x, y) {
        var canvas = this.getCanvas();
        var txt = canvas.text(x, y  + constants.CALL_BUTTON_SIZE / 2, callNumber.toString());
        txt.attr({'font-size' : '16', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
        return txt;
    },

    drawButtonText: function(text, x, y, number, suit) {
        var self = this;
        var canvas = this.getCanvas();

        var txt = canvas.text(x, y, text);
        txt.attr({'font-size' : '16', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
        txt.data("number", number);
        txt.data("suit", suit);
        txt.mouseover(function(event) {
            try {
                this.transform('s1.1');
            } catch (err) {}
        });
        txt.mouseout(function(event) {
            try {
                this.transform('s0.9091');
                self.clearError();
            } catch (err) {}
        });
        txt.click(function(event) {
            var callNumber = this.data("number");
            var callSuit = this.data("suit");
            console.log("clicked on number = " + callNumber + ", suit = " + callSuit);
            self.game.makeCall(callNumber, callSuit);
        });
        return txt;
    },

    askCall: function(minCallNumber, minCallSuit, canDouble, canRedouble) {
        var list = this.repository.getElementsByCategory('call');
        _.each(list, function(el) {
            el.show();
        });
        var buttons = this.repository.getElementsByCategory('callButton');
        _.each(buttons, function(button) {
            var callNumber = button.data("number");
            var callSuit = button.data("suit");
            console.log(callNumber, callSuit);
            if (callNumber < 8 && (callNumber > minCallNumber || (callNumber == minCallNumber && callSuit >= minCallSuit)))
            {
                button.show();
            }
            else if (callNumber == 8)
            {
                button.show();
            }
            else if (callNumber == 9 && canDouble == 'true')
            {
                button.show();
            }
            else if (callNumber == 10 && canRedouble == 'true')
            {
                button.show();
            }
        });
    },

    hideCallWindow: function() {
        var list = this.repository.getElementsByCategory('call');
        _.each(list, function(el) {
            el.hide();
        });
        var buttons = this.repository.getElementsByCategory('callButton');
        _.each(buttons, function(button) {
            button.hide();
        });
    },

    drawCallWindow: function() {
        var self = this;

        console.debug("typeof = " + typeof(minCallNumber));
        var canvas = this.getCanvas();
        var category = "call";

        var callBackground = canvas.rect(constants.CALL_X, constants.CALL_Y, constants.CALL_WIDTH, constants.CALL_HEIGHT, constants.CALL_RADIUS);
        callBackground.attr({'fill': constants.CALL_FILL, 'opacity': constants.CALL_OPACITY});
        self.repository.addElement(callBackground, "callBackground", 'call');

        var suit, number;
        for (number = 1; number <= 7; number++) {
            var txtX = constants.CALL_X + constants.CALL_PADDING_X;
            var y = constants.CALL_Y + constants.CALL_PADDING_Y + (constants.CALL_BUTTON_PADDING + constants.CALL_BUTTON_SIZE) * (number - 1);

            var txt = self.drawCallNumber(number, txtX, y);
            this.repository.addElement(txt, 'txt' + number.toString(), 'call');

            for (suit = 0; suit <= 4; suit++) {
                var x = constants.CALL_X + constants.CALL_PADDING_X + (constants.CALL_BUTTON_PADDING + constants.CALL_BUTTON_SIZE) * (suit + 1);

                var img = self.drawButton(number, suit, x, y, constants.CALL_BUTTON_SIZE, constants.CALL_BUTTON_SIZE);
                this.repository.addElement(img, 'button_' + number + '_' + suit, 'callButton');
            }
        }

        var passX = constants.CALL_X + constants.CALL_PADDING_X + 20;
        var passY = constants.CALL_Y + constants.CALL_PADDING_Y + (constants.CALL_BUTTON_PADDING + constants.CALL_BUTTON_SIZE) * 7 + 10;
        var passTxt = self.drawButtonText("Pass", passX, passY, 8, 0);
        this.repository.addElement(passTxt, 'button_pass', 'callButton');

        var doubleX = passX + 65;
        var doubleY = passY;
        var doubleTxt = self.drawButtonText("Double", doubleX, doubleY, 9, 0);
        this.repository.addElement(doubleTxt, 'button_double', 'callButton');

        var reDoubleX = doubleX + 60;
        var reDoubleY = passY;
        var reDoubleTxt = self.drawButtonText("Redouble", reDoubleX, reDoubleY, 10, 0);
        this.repository.addElement(reDoubleTxt, 'button_redouble', 'callButton');
    },

    drawProgressOverlay: function() {
      $('#canvas').hide();
      $('#progressOverlay').show();
    },

    updateProgressOverlay: function(e) {
      var percentage = 0;
      if (e.totalCount !== null) {
        percentage = Math.floor(100.0*e.completedCount / e.totalCount);
      }
      $('#progressBar').css('width', percentage + '%');
    },

    clearProgressOverlay: function() {
      $('#progressOverlay').hide();
      $('#canvas').show();
    },

    showSplash: function() {
      if (!this.splashVisible) {
        this.splashVisible = true;
        console.debug("Drawing new splash");

        var bg = this.getCanvas().rect(0, 0, constants.WIDTH, constants.HEIGHT);
        bg.attr({fill: '45-#000-#555'});
        this.repository.addElement(bg, "splashBackground", "splash");

        var logoText = this.getCanvas().text(constants.WIDTH/2, constants.HEIGHT/2, messages[conf.lang].gameTitle);
        logoText.attr({'fill' : '#fff', 'font-size' : '32', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
        this.repository.addElement(logoText, "logoText", "splash");

        var subText = this.getCanvas().text(constants.WIDTH/2, 40 + constants.HEIGHT/2, messages[conf.lang].clickToStart);
        subText.attr({'fill' : '#fff', 'font-size' : '24', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
        this.repository.addElement(subText, "subText", "splash");

        this.waitForStartGame();
      } else {
        console.debug("Splash already visible, not drawing");
      }
    },

    drawBackground: function() {
      this.clearAllFromCategory("splash");
      var bg = this.getCanvas().rect(0, 0, constants.WIDTH, constants.HEIGHT);
      bg.attr({fill: 'url("' + this.getBackgroundImageFile() + '")'});
    },
  
    initPxLoader: function() {
      var self = this;

      var loader = new PxLoader();
      var tableImage = this.getTableImageFile();
      loader.addImage(tableImage);

      var deckImage = this.getDeckImageFile();
      loader.addImage(deckImage);
  
      var teamName; 
      for (teamName in conf.teamFlags) { 
        var teamImageFile = this.getTeamImageFile(teamName);
        var smallTeamImageFile = this.getTeamImageFile(teamName, 'small');
        loader.addImage(teamImageFile);
        loader.addImage(smallTeamImageFile);
      }
      
      var suit; 
      var i;
      for (suit in constants.SUIT_TRANSLATION_TABLE) {
        for(i=2; i < 15; i++) {
          var cardImageFile = this.getCardImageFile(i, suit);
          loader.addImage(cardImageFile);
        }
      }

      var trumpSuit;
      for (trumpSuit in conf.suitIcons) {
        var iconImage = this.getSuitImageFile(trumpSuit);
        loader.addImage(iconImage);
      }

      var charCode;
      var num;
      for(charCode=65; charCode < 80; charCode++) {
        for(num=1; num < 6; num++) {
          var letter = String.fromCharCode(charCode);
          var avatarImage = this.getAvatarImageFile(letter, num);
          loader.addImage(avatarImage);
        }
      }

      loader.addCompletionListener(function() {
          self.clearProgressOverlay();
          self.showSplash();
      });

      loader.addProgressListener(function(e) {
          self.updateProgressOverlay(e);
      });

      return loader;
    },

  drawSubText: function(subscript, x, y) {
    var self = this;
    console.debug("drawSubText: " + subscript);

    var subText = this.repository.findElement("subText","text");
    if (subText) {
      subText.attr({'text': subscript});
    } else {
      subText = this.getCanvas().text(x, y, subscript);
      subText.attr({'fill' : '#fff', 'font-size' : '12', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
      this.repository.addElement(subText, "subText", "text");
    }
    subText.hide();
    this.queueAnimate(subText, {'opacity': 1}, 100); 
  },

  drawMainText: function(content, x, y) {
    var mainText = this.repository.findElement("mainText", "text");
    if (mainText) {
      mainText.attr({'text': content});
    } else {
      mainText = this.getCanvas().text(x, y, content);
      mainText.attr({'fill' : '#fff', 'font-size' : '16', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
      this.repository.addElement(mainText, "mainText", "text");
    }
    mainText.hide();
    this.queueAnimate(mainText, {'opacity': 1}, 100); 
  },

  countNewLines: function(content) {
    var matches = content.match(/\n/);
    var newLineCount = matches === null ? 1 : matches.length+1;
    console.debug("content [" + content + "] has newLineCount [" + newLineCount + "]");
    return newLineCount;
  },

  drawText: function(content, subscript) {
    //TODO: move to constants
    var x = constants.MESSAGE_X;
    var y = constants.MESSAGE_Y;

    this.drawMainText(content, x, y);

    var newLineCount = this.countNewLines(content);
    var subY = y + (newLineCount*36);
    console.debug("subY"+ subY);
    this.drawSubText(subscript, x, subY);
  },

  

  drawInvalidText: function(content) {
    //TODO: move to constants
    var x = constants.WIDTH * 0.2;
    var y = constants.HEIGHT * 0.7;

    if (this.invalidText) {
      this.invalidText.attr({'text': content});
    } else {
      this.invalidText = this.getCanvas().text(x, y, content);
      this.invalidText.attr({'fill' : '#f00', 'font-size' : '22', 'font-family' : conf.font, 'font-weight' : 'bold','stroke-width' : '1'});
    }
    this.invalidText.hide();
    console.debug("Draw invalid text");
    this.queueAnimate(this.invalidText, {'opacity': 1}, 100); 
  },

  drawError: function(heading, message) {
    console.debug("Drawing invalid text: " + heading);
    this.drawInvalidText(heading);
  },

  clearError: function() {
    console.debug("Clearing invalid text");
    this.drawInvalidText("");
  },

  drawTrumpSuit: function(trumpSuit) {
    var content = "Trump";
    var suitString = this.suitNumberToString(trumpSuit);
    var trumpSuitText = this.getAuxilCanvas().text(constants.TRUMPSUIT_PADDING, constants.TRUMPSUIT_PADDING, content);
    trumpSuitText.attr({'font-size': 20,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});
    var iconImage = this.getSuitImageFile(suitString);
    var trumpSuitIcon = this.getAuxilCanvas().image(iconImage, constants.TRUMPSUIT_X, constants.TRUMPSUIT_Y, constants.TRUMPSUIT_SIZE, constants.TRUMPSUIT_SIZE);
    this.repository.addElement(trumpSuitText, "trumpSuitText", "trumpSuit");
    this.repository.addElement(trumpSuitIcon, "trumpSuitIcon", "trumpSuit");
  },

  clearTrumpSuit: function() {
    this.clearAllFromCategory("trumpSuit");
  },

  drawDeck: function() {
    var image = this.getDeckImageFile();
    var deck = this.getCanvas().image(image, constants.CARD_MIDDLE_X, constants.CARD_MIDDLE_Y, constants.CARD_WIDTH, constants.CARD_HEIGHT);
    this.repository.addElement(deck, "tableDeck", "deck");
  },

  clearDeck: function() {
    this.clearAllFromCategory("deck");
  },

  clearAllFromCategory: function(category) {
    var list = this.repository.getElementsByCategory(category);
    _.each(list, function(el) {
      el.remove();
    });
    this.repository.clearCategory(category);
  },

  drawInitialScores: function(teams) {
    var canvas = this.getCanvas();
    var scoreTitle = canvas.text(constants.SCORE_FLAG_X[0], 10, messages[conf.lang].score);
    scoreTitle.attr({'font-size': constants.SCORE_FONT_SIZE,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});

    var i;
    for (i in teams) {
      var smallTeamImage = this.getTeamImageFile(teams[i], 'small');
      canvas.image(smallTeamImage, constants.SCORE_FLAG_X[i], constants.SCORE_FLAG_Y[i], constants.SCORE_FLAG_SIZE, constants.SCORE_FLAG_SIZE);
      var scoreText = canvas.text(constants.SCORE_FLAG_X[i]+constants.SCORE_FLAG_SIZE+ constants.SCORE_TEXT_PADDING, constants.SCORE_FLAG_Y[i]+constants.SCORE_TEXT_PADDING, "0").attr({'font-size': constants.SCORE_FONT_SIZE,'text-anchor': 'start','fill': '#fff','font-family' : conf.font, 'font-weight' : 'bold'});
      scoreText.id = teams[i];
      this.repository.addElement(scoreText,teams[i],"scoreText");
    }
  },

  updateScores: function(scores) {
    var teamScores = scores['teamScore'];

    var team;
    for (team in teamScores) {
      var textElement = this.repository.findElement(team, "scoreText");
      var oldText = textElement.attr('text');
      var newText = teamScores[team];
      if (oldText != newText) {
        console.debug("updating scores");
        this.queueText(textElement, newText);
      }
    }
  },

  drawPlayerCards: function(cards, playingOrder, callback) {
    var self = this;
    var category = "playerCards";
    var index;

    var numCards = cards.length;
    console.debug("numCards " + numCards);
    var stepSize = constants.CARD_PADDING_X;
    var offset = (constants.WIDTH - ((numCards - 1) * stepSize) - constants.CARD_WIDTH) / 2;
    console.debug("offset " + offset + " stepSize " + stepSize);

    if (numCards > 0) {

        var startX = constants.CARD_MIDDLE_X;
        var startY = constants.CARD_MIDDLE_Y;
        var deckImage = this.getDeckImageFile();
        _.each(cards, function(card, i) {
            var compositeAnimation = [];
            var endX = (i * stepSize) + offset;
            var endY = constants.CARD_AREA_Y_0;

            var cardId = self.getCardId(card, category);
            var cardImage = self.drawCard(card, startX, startY, constants.CARD_WIDTH, constants.CARD_HEIGHT, category);
            cardImage.hide();
            if (i == 12) {
                self.queueAnimate(cardImage, {x: endX, y: endY}, constants.PLAYER_CARD_ANIMATE_TIME, function() {
                    self.game[callback]();
            });
            } else {
                self.queueAnimate(cardImage, {x: endX, y: endY}, constants.PLAYER_CARD_ANIMATE_TIME);
            }
            self.repository.addElement(cardImage, cardId, category);
            for (index in playingOrder) {
                if (index != 0) {
                    var endOtherX = constants.PLAYER_CARD_X_ARR[index];
                    var endOtherY = constants.PLAYER_CARD_Y_ARR[index];
                    var deckEl = self.getCanvas().image(deckImage, startX, startY, constants.CARD_WIDTH, constants.CARD_HEIGHT);
                    deckEl.hide();
                    compositeAnimation.push({'element': deckEl, 'attr': {x: endOtherX, y: endOtherY}, 'time': constants.PLAYER_CARD_ANIMATE_TIME, 'callback': deckEl.remove});
                }
            }
            self.queueCompositeAnimation(compositeAnimation);
      });
    }
  },

  drawRightCards: function(cards) {
      console.log("drawing right cards");
      var self = this;
      var category = "opponentCards";
      var canvas = this.getCanvas();
      var numCards = cards.length;
      
      var stepSize = constants.CARD_PADDING_Y;
      var offset = constants.CARD_AREA_Y_3;
      console.debug("offset " + offset + " stepSize " + stepSize);
      
      _.each(cards, function(card, i) {
          var x = constants.CARD_AREA_X_3;
          var y = (i * stepSize) + offset;
          var cardId = self.getCardId(card, category);
          var cardImage = self.drawOpponentCard(card, x, y, constants.CARD_WIDTH, constants.CARD_HEIGHT, category);
          self.repository.addElement(cardImage, cardId, category);
      });
  },

  drawLeftCards: function(cards) {
      console.log("drawing left cards");
      var self = this;
      var category = "opponentCards";
      var canvas = this.getCanvas();
      var numCards = cards.length;

      var stepSize = constants.CARD_PADDING_Y;
      var offset = constants.CARD_AREA_Y_1;
      console.debug("offset " + offset + " stepSize " + stepSize);
      
      _.each(cards, function(card, i) {
          var x = constants.CARD_AREA_X_1;
          var y = (i * stepSize) + offset;
          var cardId = self.getCardId(card, category);
          var cardImage = self.drawOpponentCard(card, x, y, constants.CARD_WIDTH, constants.CARD_HEIGHT, category);
          self.repository.addElement(cardImage, cardId, category);
      });
  },

  drawPartnerCards: function(cards) {
      console.log("drawing partner's cards");
      var self = this;
      var category = "partnerCards";
      var canvas = this.getCanvas();
      var numCards = cards.length;

      var stepSize = constants.CARD_PADDING_X;
      var offset = constants.CARD_AREA_X_2;
      console.debug("offset " + offset + " stepSize " + stepSize);

      _.each(cards, function(card, i) {
          var x = (i * stepSize) + offset;
          var y = constants.CARD_AREA_Y_2;
          var cardId = self.getCardId(card, category);
          var cardImage = self.drawPartnerCard(card, x, y, constants.CARD_WIDTH, constants.CARD_HEIGHT, category);
          self.repository.addElement(cardImage, cardId, category);
      });
  },

  drawOtherCards: function(otherId, cards, playingOrder) {
      console.log("drawing other cards, of player " + otherId);
      console.log("playingOrder = " + playingOrder);
      var self = this;
      var canvas = this.getCanvas();

      var absId = (otherId - this.game.humanPlayer.id + 4) % 4;
      var el = self.repository.findElement(absId.toString() + '_Deck', 'playerDeck');
      el.hide();

      if (absId == 2) {
          self.drawPartnerCards(cards);
      }
      else if (absId == 1) {
          self.drawLeftCards(cards);
      }
      else if (absId == 3) {
          self.drawRightCards(cards);
      }
  },

  queueText: function(obj, text) {
    var task = new TextTask(obj, text);
    this.taskQueue.addTask(task);
  },

  queueAnimate: function(obj, attr, time, callback) {
    var task = new AnimationTask(obj, attr, time, callback);
    this.taskQueue.addTask(task);
  },

  queueCompositeAnimation: function(animationList) {
    var task = new CompositeAnimationTask(animationList);
    this.taskQueue.addTask(task);
  },

  drawPlayerMove: function(playerMove) {
    var category = "playerMoves";

    var player = playerMove.getPlayer();
    var card = playerMove.getCard();
    var playerIndex = player.getIndex(); 

    var startX = constants.PLAYER_X_ARR[playerIndex];
    var startY = constants.PLAYER_Y_ARR[playerIndex];

    var endX = constants.HAND_X_ARR[playerIndex];
    var endY = constants.HAND_Y_ARR[playerIndex];

    var cardId = this.getCardId(card, category);
    var cardImage = this.drawCard(card, startX, startY, constants.CARD_WIDTH, constants.CARD_HEIGHT, category);
    cardImage.hide();
    console.debug("Drawing playerMove"); 
    this.queueAnimate(cardImage, {x: endX, y: endY}, constants.PLAYER_MOVE_ANIMATE_TIME);
    this.repository.addElement(cardImage, cardId, category);
  },

  clearPlayerMoves: function() {
    console.debug("Clearing all playerMoves");
    var playerMoves = this.repository.getElementsByCategory('playerMoves');
    _.each(playerMoves, function (pm) { 
      pm.remove(); 
    });
    this.repository.clearCategory('playerMoves');
  },

  clearAnimationQueue: function() {
    this.taskQueue.q = [];
    this.taskQueue.state = "INITIALIZED";
  },

  getCardId: function(card, category) {
    var id = category + "_" + card.rank + "_" + card.suit;
    return id;
  },

  removePlayerCard: function(card) {
    var id = this.getCardId(card,'playerCards');
    var cardImage = this.repository.removeElementFromCategory(id, 'playerCards');
    if (cardImage.glowSet)
        cardImage.glowSet.remove();
    cardImage.remove();
  },

  clearPlayerCards: function() {
    var playerCards = this.repository.getElementsByCategory('playerCards');
    _.each(playerCards, function(c) { c.remove(); });
    this.repository.clearCategory("playerCards");
  },

  drawCard: function(card, x, y, width, height, category) {
    var self = this;
    var cardImage = this.getCanvas().image(this.getCardImageFile(card.rank, card.suit), x, y, width, height);

    cardImage.mouseover(function(event) {
        try {
            this.glowSet = this.glow();
        } catch (err) {}
    });
    cardImage.mouseout(function(event) {
        try {
            this.glowSet.remove();
            self.clearError();
        } catch (err) {}
    });

    cardImage.click(function(event) {
        console.log("DEBUG in cardImage clickEventHandler");
        self.game.handleCardClicked(card);
    });

    cardImage.id = this.getCardId(card, category);
    return cardImage;
  },

  drawPartnerCard: function(card, x, y, width, height, category) {
      var self = this;
      var cardImage = this.getCanvas().image(this.getCardImageFile(card.rank, card.suit), x, y, width, height);

      cardImage.mouseover(function(event) {
          try {
              self.glowSet = this.glow();
          } catch (err) {}
      });
      cardImage.mouseout(function(event) {
          try {
              self.glowSet.remove();
              self.clearError();
          } catch (err) {}
      });

      cardImage.click(function(event) {
        console.log("DEBUG in partner clickEventHandler");
        //self.game.handlePartnerCardClicked(card);
      });

      cardImage.id = this.getCardId(card, category);
      return cardImage;
  },

  drawOpponentCard: function(card, x, y, width, height, category) {
      var self = this;
      var cardImage = this.getCanvas().image(this.getCardImageFile(card.rank, card.suit), x, y, width, height);
      cardImage.id = this.getCardId(card, category);
      return cardImage;
  },

  drawPlayerDeck: function(index) {
      var image = this.getDeckImageFile();
      var deck;
      var canvas = this.getCanvas();
      //deck = canvas.image(image, constants.HAND_X_ARR[index], constants.HAND_Y_ARR[index], constants.CARD_WIDTH, constants.CARD_HEIGHT);
      deck = canvas.image(image, constants.PLAYER_CARD_X_ARR[index], constants.PLAYER_CARD_Y_ARR[index], constants.CARD_WIDTH, constants.CARD_HEIGHT);
      return deck;
  },

  drawPlayer: function(player) {
    var canvas = this.getCanvas();

    var textX  = constants.TEXT_X_ARR[player.getIndex()];
    var textY = constants.TEXT_Y_ARR[player.getIndex()];

    var playerX = constants.PLAYER_X_ARR[player.getIndex()];
    var playerY = constants.PLAYER_Y_ARR[player.getIndex()];

    var playerImage = canvas.image(this.getPlayerImageFile(), playerX, playerY, constants.PLAYER_SIZE, constants.PLAYER_SIZE);

    var playerName = player.getName();
    var nameTxt = canvas.text(textX, textY , playerName);
    nameTxt.attr({'fill' : '#fff', 'font-size' : '14', 'font-family' : conf.font, 'font-weight' : 'bold'});

    if (player.getIndex() != 0) {
        var deck = this.drawPlayerDeck(player.getIndex());
        this.repository.addElement(deck, player.getIndex().toString() + "_Deck", "playerDeck");
    }
  },

  clearCall: function() {
      var category = 'callShow';
      var list = this.repository.getElementsByCategory(category);
      _.each(list, function(el) {
          el.remove();
      });
      this.repository.clearCategory(category);
      
  },

  clearHover: function() {
      var category = 'hover';
      var list = this.repository.getElementsByCategory(category);
      _.each(list, function(el) {
          el.stop();
          el.remove();
      });
      this.repository.clearCategory(category);
      
  },

  drawWaiting: function(index) {
      var category = 'hover';
      var canvas = this.getCanvas();

      var x = constants.HOVER_X_ARR[index];
      var y = constants.HOVER_Y_ARR[index];

      var img = this.getWaitingImageFile();
      var waitingIcon = canvas.image(img, x, y, constants.HOVER_SIZE, constants.HOVER_SIZE);

      var animSpin = function () {
          waitingIcon.stop().attr({'transform': 'r0'}).animate({'transform': 'r360'}, 2000, animSpin);
      }
      animSpin();
      this.repository.addElement(waitingIcon, 'hover'+index, 'hover');
  },

  drawCall: function(index, callNumber, callSuit) {
      var category = 'callShow';
      var canvas = this.getCanvas();

      var x = constants.CALL_SUIT_X_ARR[index];
      var y = constants.CALL_SUIT_Y_ARR[index];

      var txtX = constants.CALL_NUM_X_ARR[index];
      var txtY = constants.CALL_NUM_Y_ARR[index];

      if (typeof callNumber == 'string') {
          var text;
          if (callNumber == 'pass')
              text = 'Pass';
          else if (callNumber == 'double')
              text = 'Double';
          else if (callNumber == 'redouble')
              text = 'Redouble';
          txtX = (x + txtX) / 2;
          var suitText = canvas.text(txtX, txtY, text);
          suitText.attr({'fill' : '#ff0', 'font-size' : '14', 'font-family' : conf.font, 'font-weight' : 'bold'});
          this.repository.addElement(suitText, 'callText_' + index.toString(), category);
      } else {
        var suitString = this.suitNumberToString(callSuit);
        var suitIcon = this.getSuitImageFile(suitString);
        var suitImage = canvas.image(suitIcon, x, y, constants.CALL_SUIT_SIZE, constants.CALL_SUIT_SIZE);
        this.repository.addElement(suitImage, 'call_' + index.toString(), category);
        var suitText = canvas.text(txtX, txtY, callNumber.toString());
        suitText.attr({'fill' : '#ff0', 'font-size' : '14', 'font-family' : conf.font, 'font-weight' : 'bold'});
        this.repository.addElement(suitText, 'callText_' + index.toString(), category);
      }
  },

  waitForEvent: function(callback) {
    var self = this;

    var overlay = this.getCanvas().rect(0, 0, constants.WIDTH, constants.HEIGHT);
    overlay.attr({fill: "#000", stroke: "none", opacity: '0'}); 
    overlay.hide();

    console.debug("Animating overlay");
    this.queueAnimate(overlay, {opacity: '0'}, 100, function() {
      var timeoutId = setTimeout(function() {
        self.game[callback]();
        console.debug("Timeout kicked in"); 
        overlay.remove();
      }, 5000);

      overlay.mouseup(function(event) {
        clearTimeout(timeoutId);
        self.game[callback]();
        console.debug("Removing overlay"); 
        overlay.remove();
      }); 

    });
  },
  
  waitForStartGame: function() {
    var callback = 'init';
    //this.waitForEvent(callback);
    this.game[callback]();
  },

  waitForNextHand: function() {
    var callback = 'sendReady';
    this.waitForEvent(callback);  
  },

  waitForNextGame: function() {
    var callback = 'nextGame';
    this.waitForEvent(callback);  
  },
  
  getCardImageFile : function(rank, suit) {
    return conf.cardsDirectory + 'simple_' + constants.SUIT_TRANSLATION_TABLE[suit] + '_' + constants.RANK_TRANSLATION_TABLE[rank] + '.png';
  },
  
  getPlayerImageFile: function() {
    var charCode = Math.floor(Math.random() * 15) + 65;
    var letter = String.fromCharCode(charCode);
    var number = Math.floor(Math.random() * 5) + 1;
    return this.getAvatarImageFile(letter, number);
  },

  getAvatarImageFile: function(letter, num) {
    return conf.avatarDirectory + letter + '0' + num + '.png';
  },

  getTeamImageFile: function(teamName, size) {
    if (!(teamName in conf.teamFlags)) {
      teamName = 'default';
    }

    var flagDir;
    if (size == 'small') {
      flagDir = conf.flagSmallDir;
    } else {
      flagDir = conf.flagDir;
    }
    return flagDir + conf.teamFlags[teamName];
  },

  getSuitImageFile: function(trumpSuit) {
    return conf.suitsDirectory + conf.suitIcons[trumpSuit];
  },

  getTableImageFile: function() {
    return conf.imageDir + 'green_poker_skin.png';
  },

  getDeckImageFile: function() {
    return conf.imageDir + 'card_back.png';
  },

  getBackgroundImageFile: function() {
      return conf.imageDir + 'baize.png';
  },

  getWaitingImageFile: function() {
      return conf.imageDir + 'waiting.png';
  }
};
