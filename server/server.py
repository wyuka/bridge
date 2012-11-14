import logging

import tornado.ioloop
import tornado.web
import tornado.websocket

from message import MessageWriter
from game import CardGame, ScoreKeeper
from cards import Card, HandInfo, PlayerMove
from player import HumanPlayer, Player

class GameServer:
    def __init__(self):
        self.players = []
        self.writer = None
        self.cardGame = None
        self.scores = None
        self.hand = None
        self.handlerQueue = []
        self.readyQueue = []
        self.gameStarted = False

    @staticmethod
    def getSuitForNumber(num):
        suits = ["CLUBS", "DIAMONDS", "HEARTS", "SPADES", "NOTRUMP"]
        return suits[num]

    def addWriter(self, writer):
        self.writers.append(writer)

    def startGame(self, handler, req):
        nr = len(self.players)
        if nr == 4:
            message = {'response': 'roomFull'}
            logging.debug("Room is full")
            handler.sendMessage(message)
        else:
            if nr % 2 == 0:
                teamName = "Team A"
            else:
                teamName = "Team B"
            #player = Player(nr, req['playerName'], teamName)
            #FIXME: uncomment the previous line, just debugging
            player = HumanPlayer(nr, nr, teamName)
            self.players.append(player)
            self.handlerQueue.append(handler)
            if len(self.players) == 4:
                logging.debug("Game started")
                self.cardGame = CardGame(self.players)
                self.scores = ScoreKeeper(self.players)
                self.cardGame.startingPlayerIndex = 0
                self.cardGame.setPlayingOrder()
                self.gameStarted = True
                self.cardGame.dealCards()
                self.cardGame.initCall()
            message = {'response': 'joinedGame', 'id': nr, 'name' : req['playerName'], 'team': teamName}
            logging.debug("%s added to room", req['playerName'])
            handler.sendMessage(message)

    def getGameInfo(self, handler, req):
        if self.gameStarted:
            message = {'response': 'gameInfo'}
            playersList = []
            i = 0
            for player in self.cardGame.getPlayers():
                playersList.append({'index': i, 'name': player.name,
                                    'id': player.id, 'team': player.team})
                i = i + 1

            message['players'] = playersList
            message['playingOrder'] = self.cardGame.getOrder()
            message['gameId'] = str(self.cardGame.id)

            self.broadcast(message)

    def dealCards(self, handler, request):
        response = {'response': 'dealCards'}
        try:
            player = self.cardGame.getPlayerById(request['playerId'])
            cards = player.getCards()
            logging.debug("Total nr of cards: %s", len(cards))

            response['cards'] = [{'rank': card.rank, 'suit': card.suit}
                           for card in cards]
            handler.sendMessage(response)
        except Exception as ex:
            #self.writer.sendError(ex)
            raise

    def readyForCall(self, handler, request):
        if self.cardGame.callWon:
            response = {'response': 'callWon'}
            response['callNumber'] = self.cardGame.highestCall[0]
            response['callSuit'] = self.cardGame.highestCall[1]
            response['playerId'] = self.cardGame.highestCaller.id
            partner = self.cardGame.getPlayerById((self.cardGame.highestCaller.id + 2) % 4)
            response['partnerPlayerId'] = partner.id
            response['partnerCards'] = partner.getCards()
            handler.sendMessage(response)
        else:
            player = self.cardGame.getPlayerById(self.cardGame.callTurn)
            response = {
                'playerId': player.id,
                'response': 'askCall',
                'minCallNumber': self.cardGame.minCall[0],
                'minCallSuit': self.cardGame.minCall[1]
            }
            if self.cardGame.redouble:
                response['canDouble'] = 'false';
                response['canRedouble'] = 'false';
            elif self.cardGame.double:
                response['canDouble'] = 'false';
                response['canRedouble'] = 'true';
            elif self.cardGame.highestCall == [0, 0]:
                response['canDouble'] = 'false';
                response['canRedouble'] = 'false';
            else:
                response['canDouble'] = 'true';
                response['canRedouble'] = 'false';
            handler.sendMessage(response)

    def makeCall(self, handler, request):
        response = {'response': 'callMade'}
        player = self.cardGame.getPlayerById(request['playerId'])
        if player == self.cardGame.players[self.cardGame.callTurn]:
            response['id'] = player.id
            callNumber = int(request['callNumber'])
            callSuit = int(request['callSuit'])
            # if passed
            if callNumber == 8:
                self.cardGame.numberOfPasses += 1
                response['callNumber'] = 'pass'
                response['callSuit'] = 0
                if self.cardGame.numberOfPasses == 3:
                    self.cardGame.callWon = True
                    trumpSuit = self.getSuitForNumber(self.cardGame.highestCall[1])
                    self.cardGame.chooseTrump(trumpSuit)
                    self.hand = HandInfo()
                    playerToStart = self.cardGame.getPlayerById((self.cardGame.highestCaller.id + 1) % 4)
                    self.cardGame.changePlayingOrder(playerToStart)
                self.cardGame.callTurn = (self.cardGame.callTurn + 1) % 4
            # if double
            elif callNumber == 9:
                if self.cardGame.highestCall != [0, 0] and self.cardGame.double == False:
                    self.cardGame.numberOfPasses = 0
                    response['callNumber'] = 'double'
                    response['callSuit'] = 0
                    self.cardGame.double = True
                    self.cardGame.doubleCaller = player
                    self.cardGame.callTurn = (self.cardGame.callTurn + 1) % 4
                else:
                    return
            # if re-double
            elif callNumber == 10:
                if self.cardGame.double:
                    self.cardGame.numberOfPasses = 0
                    response['callNumber'] = 'redouble'
                    response['callSuit'] = 0
                    self.cardGame.double = False
                    self.cardGame.redouble = True
                    self.cardGame.doubleCaller = player
                    self.cardGame.callTurn = (self.cardGame.callTurn + 1) % 4
                else:
                    return
            # if not passed
            elif callNumber > self.cardGame.highestCall[0] or (callNumber ==  self.cardGame.highestCall[0] and callSuit >= self.cardGame.highestCall[1]):
                if callNumber < 8 and callSuit < 5:
                    self.cardGame.numberOfPasses = 0
                    self.cardGame.double = False
                    self.cardGame.redouble = False
                    response['callNumber'] = request['callNumber']
                    response['callSuit'] = request['callSuit']
                    self.cardGame.highestCall = [callNumber, callSuit]
                    self.cardGame.highestCaller = player
                    if callSuit == 4:
                        self.cardGame.minCall[0] = callNumber + 1
                        self.cardGame.minCall[1] = 0
                    else:
                        self.cardGame.minCall[0] = callNumber
                        self.cardGame.minCall[1] = callSuit + 1
                    self.cardGame.callTurn = (self.cardGame.callTurn + 1) % 4
                else:
                    return
            else:
                return
            self.broadcast(response)

    def nextGame(self, req):
        jsonResponse = {'response': 'nextGame'}
        try:
            jsonResponse['resultCode'] = 'SUCCESS'

            self.cardGame.clearGame()
            self.scores.clearTeamScores()

        except Exception as ex:
            self.writer.sendError(ex)
            raise

        self.writer.sendMessage(jsonResponse)

    def chooseTrump(self, handler, request):
        response = {'response': 'trumpChosen'}
        if self.cardGame.getPlayerById(request['playerId']) != self.cardGame.highestCaller:
            return
        try:
            trumpSuit = request['suit']
            self.cardGame.chooseTrump(trumpSuit)
            self.cardGame.dealCards()
            self.hand = HandInfo()
            self.broadcast(response)
        except Exception as ex:
            raise

    def askPlayers(self, handler):
        jsonResponse = {'response': 'handPlayed'}
        trumpSuit = self.cardGame.trumpSuit

        while not self.hand.isComplete():
            player = self.cardGame.getNextPlayer(self.hand.getStep())

            logging.debug("Asking player %s for move", player.name)

            # asynchronous via websocket
            if isinstance(player, HumanPlayer):
                message = {}
                message['response'] = 'askMove'
                message['hand'] = self.hand
                handler.sendMessage(message)
                break
            else:
                card = player.getNextMove(self.hand, trumpSuit)
                self.hand.addPlayerMove(PlayerMove(player, card))
                logging.debug("%s played %s", player.name, card)

        if self.hand.isComplete():
            winningMove = self.hand.decideWinner(trumpSuit)
            pointsWon = self.hand.getHandPoints()
            winningPlayer = winningMove.getPlayer()
            self.readyQueue = []

            logging.debug("Winner is %s\n", winningPlayer)

            self.scores.registerWin(winningPlayer, pointsWon)
            scores = self.scores.getScores()

            self.cardGame.changePlayingOrder(winningPlayer)

            jsonResponse['hand'] = self.hand
            jsonResponse['winningCard'] = winningMove.card
            jsonResponse['winningPlayerId'] = winningPlayer.id
            jsonResponse['scores'] = scores
            self.writer.sendMessage(jsonResponse)

    def isReady(self, handler, request):
        if self.hand.isComplete() == False:
            player = self.cardGame.getNextPlayer(self.hand.getStep())
            if player.id == request['playerId']:
                message = {}
                message['response'] = 'askMove'
                handler.sendMessage(message)
        else:
            winningMove = self.hand.decideWinner(self.cardGame.trumpSuit)
            #pointsWon = self.hand.getHandPoints()
            winningPlayer = winningMove.getPlayer()
            self.hand = HandInfo()

            logging.debug("Winner is %s\n", winningPlayer)

            self.scores.registerWin(winningPlayer, 1)
            scores = self.scores.getScores()

            self.cardGame.changePlayingOrder(winningPlayer)

            message = {'response' : 'handPlayed'}
            message['winningCard'] = winningMove.card
            message['winningPlayerId'] = winningPlayer.id
            message['scores'] = scores
            self.broadcast(message)

    def makeMove(self, handler, req):
        try:
            player = self.cardGame.getPlayerById(req['playerId'])
            playedCard = Card(req['suit'], req['rank'])

            playerMove = PlayerMove(player, playedCard)
            validMove = self.hand.validatePlayerMove(playerMove, self.cardGame.trumpSuit)
            if not validMove:
                response = {'response': 'invalidMove', 'playerId': req['playerId']}
                handler.sendMessage(response)
            else:
                self.hand.addPlayerMove(playerMove)
                player.removeCard(playedCard)
                message = {}
                message['response'] = 'moveMade'
                message['hand'] = self.hand
                message['id'] = player.id
                self.broadcast(message)

        except Exception as ex:
            self.writer.sendError(ex)
            raise

    def broadcast(self, message):
        for handler in self.handlerQueue:
            handler.sendMessage(message)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/index.html")

class AboutHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/about.html")

class ContactHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("template/contact.html")

class MessageHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        logging.info("Websocket opened")

        self.writer = MessageWriter(self)

    def sendMessage(self, message):
        self.writer.sendMessage(message)

    def on_message(self, message):
        global gameServer
        req = tornado.escape.json_decode(message)
        logging.debug("Message received: %s", req)
        methodName = req['command']
        if hasattr(gameServer, methodName):
            getattr(gameServer, methodName)(self, req)
        else:
            logging.error("Received unknown command [%s]", methodName)

    def on_close(self):
        logging.info("Websocket closed")
        self.gameServer = None

gameServer = None

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, 
                        format='%(asctime)s %(levelname)s %(message)s')

    gameServer = GameServer()

    handlers = [ (r"/websocket", MessageHandler) ]

    application = tornado.web.Application(handlers, debug=True)
    logging.info("Server started")

    application.listen(8080)
    tornado.ioloop.IOLoop.instance().start()

