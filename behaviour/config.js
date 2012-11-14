'use strict';

/**
 * External configuration file. 
 */ 
var conf = {
  lang: 'en',

  font: 'Ubuntu',	

	network: {
    wsURL : 'ws://0.0.0.0:8080/websocket'
	},
  
  imageDir: 'images/',
  avatarDirectory: 'images/avatars/',  
  cardsDirectory: 'images/cards/', 
  
  suitsDirectory: 'images/suits/', 
  suitIcons: {
    'SPADES': 'Spades64.png',
    'CLUBS': 'Clubs64.png',
    'DIAMONDS': 'Diamond64.png',
    'HEARTS': 'Hearts64.png',
    'NOTRUMP': 'NoTrump64.png',
  },

  flagDir: 'images/flags/64/', 
  flagSmallDir: 'images/flags/32/', 
  teamFlags: {
    'Team A': 'Suriname.png',
    'Team B': 'Netherlands.png'
  },
	
	// my skins
	skins: {		
		gray:  {
			backgroundColor: '#666666',
			buttonColor: '#333333',
			opacity: 0,
			time: false,
			autoHide: false
		}
	}
	
};
