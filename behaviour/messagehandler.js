var WEB_SOCKET_SWF_LOCATION = "behaviour/lib/WebSocketMain.swf";

function MessageHandler() {
}

MessageHandler.prototype = {

  setGame: function(game) {
    this.game = game;
  },

  connect: function() {
    var self = this;
 
    this.ws = new WebSocket(conf.network.wsURL);
   
    this.ws.onopen = function() {
        self.game.start();
        console.debug("Websocket opened, game started");
    };

    this.ws.onclose = function() {
        console.debug("Websocket closed, game suspended");
        $('#disconnectModal').modal('show');
    }; 

    this.ws.onmessage = function(evt) {
        self.receiveMessage(evt.data);
    };
  },
  
  sendMessage: function(message) {
    var messageStr = JSON.stringify(message);
    this.ws.send(messageStr);

    console.debug("Sent: " + messageStr);
  },

  receiveMessage : function(msg) {
    console.debug("Received: " + msg);

    var json = JSON.parse(msg);
    var handlerName = json.response;
    var functionCall = this[handlerName];

    //check whether handler function exists
    if (typeof functionCall != 'function') {
        console.error('Unknown response: ' + handlerName);
    } else {
        console.debug('Calling method handler: ' + handlerName);
    }

    //call handler function
    this[handlerName](json);
  },
  
  joinedGame: function (response) {
      this.game.humanId = response.id;
      console.log("joinedGame called, humanId is " + this.game.humanId);
      this.game.getGameInfo();
  },
  gameInfo: function (response) {
      var self = this;
      var playerList = response.players;
      this.game.playingOrder = response.playingOrder;
      _.each(response.players, function (p) {
          var isHuman = (p.id == self.game.humanId);
          var index = (p.index + 4 - self.game.humanId) % 4;
          var player = new Player(p.id, index, p.name, isHuman, p.team);
          self.game.addPlayer(player);
          self.game.drawPlayer(player);
      });
      this.game.askCards();
  },

  nextGame: function(response) {
    this.game.handleNextGame();
  },

  dealCards: function (response) {
    var cards = this.transformCards(response.cards);
    this.game.handleDealtCards(cards);
  },

  callMade: function (response) {
      this.game.handleCallMade(response.id, response.callNumber, response.callSuit);
  },

  askCall: function (response) {
      this.game.handleAskCall(response.playerId, response.minCallNumber, response.minCallSuit, response.canDouble, response.canRedouble);
  },

  callWon: function (response) {
      var cards = this.transformCards(response.partnerCards);
      this.game.handleCallWon(response.playerId, response.callNumber, response.callSuit, response.partnerPlayerId, cards);
  },

  trumpChosen: function (response) {
      this.game.handleTrumpChosen();
  },

  allCards: function (response) {
    var cards = this.transformCards(response.cards);
    this.game.handleAllCards(cards);
  },

  askMove: function (response) {
    //var playerMoves = this.transformPlayerMoves(response.hand);
    this.game.handleAskMove();
  },

  invalidMove: function (response) {
    this.game.handleInvalidMove();
  },

  moveMade: function (response) {
    var playerMoves = this.transformPlayerMoves(response.hand);
    this.game.handleMoveMade(playerMoves, response.id);
  },

  handPlayed: function (response) {
    var winningPlayerId = response.winningPlayerId;
    var scores = response.scores;

    this.game.handleHandPlayed(winningPlayerId, scores);
  },

  gameDecided: function (response) {
    var winningTeam = response.winningTeam;
    var scores = response.scores;

    this.game.handleGameDecided(winningTeam, scores);
  },
  
  exception: function (response) {
    this.game.drawText(messages[conf.lang].errorMessage);
    console.error(response.resultMessage);
  },
  
  transformPlayerMoves : function (hand) {
    var self = this;
    var moves = [];
    var sorted = _.sortBy(hand, function(playerMove) { return playerMove.sequenceNumber; });
    _.each(sorted, function(move) {
        var jsonCard = move['card'];
        var seqNo = move['sequenceNumber'];
        var card = new Card(jsonCard['rank'], jsonCard['suit']);
        var player = self.game.getPlayerById(move['playerId']);
        
        moves.push(new PlayerMove(player, card, seqNo));
    });
    return moves;
  },

  transformCards : function (cards) {
    return _.map(cards, function (c) { return  new Card(c.rank, c.suit); });
  }
};
