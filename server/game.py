import logging
import uuid

from cards import Deck


class ScoreKeeper:

    def __init__(self, players=None):
        self.teamScore = {}
        self.playerScore = {}
        for player in players:
            self.playerScore[player.name] = 0
            self.teamScore[player.team] = 0

    def registerTrick(self, player):
        self.teamScore[player.team] = self.teamScore[player.team] + 1
        self.playerScore[player.name] = self.playerScore[player.name] + 1

    def clearTeamScores(self):
        for team in self.teamScore:
          self.teamScore[team] = 0

    def getWinningTeam(self):
        return max(self.teamScore, key=self.teamScore.get)

    def getScores(self):
        return {"teamScore": self.teamScore, "playerScore": self.playerScore}

class CardGame:

    def __init__(self, players=None):
        self.id = uuid.uuid1()
        self.deck = CardGame.createDeck()
        self.players = players
        self.startingPlayerIndex = 0
        self.state = "INITIALIZED"
        self.trumpSuit = None
        self.playingOrder = []

        # call variables
        self.minCall = []
        self.highestCaller = None
        self.doubleCaller = None
        self.highestCall = []
        self.numberOfPasses = 0
        self.callWon = False
        self.double = False
        self.redouble = False
        self.callTurn = 0
        self.firstCall = False
        self.firstCallReadyQueue = []

    @staticmethod
    def createDeck():
        deck = Deck()
        deck.shuffle()
        return deck

    def initCall(self):
        self.highestCaller = None
        self.doubleCaller = None
        self.highestCall = [0, 0]
        self.minCall = [0, 1]
        self.double = False
        self.redouble = False
        self.numberOfPasses = 0
        self.callWon = False
        self.callTurn = 0
        self.firstCall = True
        self.firstCallReadyQueue = []

    def getNextPlayer(self, step):
        index = self.playingOrder[step]
        return self.players[index]

    def changePlayingOrder(self, winningPlayer):
        self.startingPlayerIndex = self.players.index(winningPlayer)
        self.setPlayingOrder()

    def chooseTrump(self, trumpSuit):
        self.trumpSuit = trumpSuit
        logging.debug("Trump is chosen as %s", self.trumpSuit)
        self.state = "TRUMP_CHOSEN"

    def dealCards(self):
        while self.deck.hasNext():
            for player in self.players:
                nextCard = self.deck.removeCard()
                player.addCard(nextCard)

        self.state = "DEALT"

    def getPlayers(self):
        return self.players

    def getPlayerById(self, playerId):
        player = next((p for p in self.players if p.id == playerId), None)
        return player

    def getOrder(self):
        return self.playingOrder

    def setPlayingOrder(self):
        numPlayers = len(self.players)
        self.playingOrder = [(self.startingPlayerIndex + i) % numPlayers
                             for i in range(0, numPlayers)]

    def getPlayersInOrder(self):
        for i in self.getOrder():
            yield self.players[i]

    def clearGame(self):
        self.deck = CardGame.createDeck() 
        for player in self.players:
          player.clearCards()

if __name__ == "__main__":
    game = CardGame()
