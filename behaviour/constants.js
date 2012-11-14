'use strict';

function Constants() {

  this.WIDTH = 760;
  this.HEIGHT = 600;
  
  this.AUXIL_WIDTH = 190;
  this.AUXIL_HEIGHT = 600;

  this.CARD_WIDTH = 45;
  this.CARD_HEIGHT = 70;

  this.CARD_AREA_PADDING = 10;
  this.CARD_PADDING_X = 20;
  this.CARD_PADDING_Y = 30;

  this.CARD_AREA_X_0 = (this.WIDTH - this.CARD_PADDING_X * 12 - this.CARD_WIDTH) / 2;
  this.CARD_AREA_X_1 = this.CARD_AREA_PADDING;
  this.CARD_AREA_X_2 = (this.WIDTH - this.CARD_PADDING_X * 12 - this.CARD_WIDTH) / 2;
  this.CARD_AREA_X_3 = this.WIDTH - this.CARD_AREA_PADDING - this.CARD_WIDTH;
  
  this.CARD_AREA_Y_0 = this.HEIGHT - this.CARD_AREA_PADDING - this.CARD_HEIGHT;
  this.CARD_AREA_Y_1 = (this.HEIGHT - this.CARD_PADDING_Y * 12 - this.CARD_HEIGHT)/2;
  this.CARD_AREA_Y_2 = this.CARD_AREA_PADDING;
  this.CARD_AREA_Y_3 = (this.HEIGHT - this.CARD_PADDING_Y * 12 - this.CARD_HEIGHT)/2;

  this.CARD_MIDDLE_Y = (this.HEIGHT / 2) - (this.CARD_HEIGHT / 2);
  this.CARD_MIDDLE_X = (this.WIDTH / 2) - (this.CARD_WIDTH / 2);
  this.CARD_X_ARR = [this.CARD_MIDDLE_X, this.CARD_MIDDLE_X - 2*this.CARD_WIDTH,this.CARD_MIDDLE_X, this.CARD_MIDDLE_X + 2*this.CARD_WIDTH];
  this.CARD_Y_ARR = [this.CARD_MIDDLE_Y + 0.5*this.CARD_HEIGHT, this.CARD_MIDDLE_Y, this.CARD_MIDDLE_Y - 0.75*this.CARD_HEIGHT, this.CARD_MIDDLE_Y];

  this.PLAYER_CARD_X_ARR = [this.CARD_MIDDLE_X, this.CARD_AREA_X_1, this.CARD_MIDDLE_X, this.CARD_AREA_X_3];
  this.PLAYER_CARD_Y_ARR = [this.CARD_AREA_Y_0, this.CARD_MIDDLE_Y, this.CARD_AREA_Y_2, this.CARD_MIDDLE_Y];

  this.CALL_WIDTH = 260;
  this.CALL_HEIGHT = 300;
  this.CALL_X = (this.WIDTH - this.CALL_WIDTH) / 2;
  this.CALL_Y = (this.HEIGHT - this.CALL_HEIGHT) / 2;
  this.CALL_RADIUS = 10;
  this.CALL_OPACITY = 0.6;
  this.CALL_FILL = '#fff';
  this.CALL_BUTTON_SIZE = 22;
  this.CALL_PADDING_X = 40;
  this.CALL_PADDING_Y = 30;
  this.CALL_BUTTON_PADDING = 12;

  this.PLAYER_VERT_PADDING = 10;
  this.PLAYER_SIZE = 50;

  this.TRUMPSUIT_X = 10;
  this.TRUMPSUIT_Y = 35;
  this.TRUMPSUIT_PADDING = 16;

  this.HAND_X_ARR = [(this.WIDTH - this.CARD_WIDTH) / 2, (this.WIDTH - this.CARD_WIDTH) / 2 - this.CARD_PADDING_X, (this.WIDTH - this.CARD_WIDTH) / 2, (this.WIDTH - this.CARD_WIDTH) / 2 + this.CARD_PADDING_X];
  this.HAND_Y_ARR = [(this.HEIGHT - this.CARD_HEIGHT) / 2 + this.CARD_PADDING_Y, (this.HEIGHT - this.CARD_HEIGHT) / 2, (this.HEIGHT - this.CARD_HEIGHT) / 2 - this.CARD_PADDING_Y, (this.HEIGHT - this.CARD_HEIGHT) / 2];

  this.PLAYER_MIDDLE_Y = (this.HEIGHT / 2) - (this.PLAYER_SIZE / 2);
  this.PLAYER_MIDDLE_X = (this.WIDTH / 2) - (this.PLAYER_SIZE / 2);
  this.PLAYER_X_1 = ((this.CARD_AREA_X_1 + this.CARD_WIDTH + this.CARD_AREA_PADDING) + this.HAND_X_ARR[1] - this.PLAYER_SIZE)/2;
  this.PLAYER_Y_2 = ((this.CARD_AREA_Y_2 + this.CARD_HEIGHT + this.CARD_AREA_PADDING) + this.HAND_Y_ARR[2] - this.PLAYER_SIZE)/2;
  this.PLAYER_X_3 = ((this.CARD_AREA_X_3 - this.CARD_AREA_PADDING) + this.HAND_X_ARR[3] + this.CARD_WIDTH - this.PLAYER_SIZE)/2;
  this.PLAYER_Y_0 = ((this.CARD_AREA_Y_0 - this.CARD_AREA_PADDING) + this.HAND_Y_ARR[0] + this.CARD_HEIGHT - this.PLAYER_SIZE)/2;

  this.PLAYER_X_ARR = [this.PLAYER_MIDDLE_X, this.PLAYER_X_1, this.PLAYER_MIDDLE_X, this.PLAYER_X_3];
  this.PLAYER_Y_ARR = [this.PLAYER_Y_0, this.PLAYER_MIDDLE_Y, this.PLAYER_Y_2, this.PLAYER_MIDDLE_Y];

  this.TEXT_HEIGHT = 16;

  this.TEXT_X_ARR = [this.PLAYER_X_ARR[0] + this.PLAYER_SIZE / 2, 
                     this.PLAYER_X_ARR[1] + this.PLAYER_SIZE / 2,
                     this.PLAYER_X_ARR[2] + this.PLAYER_SIZE / 2,
                     this.PLAYER_X_ARR[3] + this.PLAYER_SIZE / 2];
  this.TEXT_Y_ARR = [this.PLAYER_Y_ARR[0] + this.PLAYER_SIZE + this.PLAYER_VERT_PADDING + this.TEXT_HEIGHT,
                     this.PLAYER_Y_ARR[1] + this.PLAYER_SIZE + this.PLAYER_VERT_PADDING + this.TEXT_HEIGHT,
                     this.PLAYER_Y_ARR[2] - this.PLAYER_VERT_PADDING - this.TEXT_HEIGHT,
                     this.PLAYER_Y_ARR[3] + this.PLAYER_SIZE + this.PLAYER_VERT_PADDING + this.TEXT_HEIGHT];

  this.CALL_SUIT_SIZE = this.CALL_BUTTON_SIZE;

  this.CALL_SUIT_X_ARR = [this.PLAYER_X_ARR[0] + this.PLAYER_SIZE * 3 / 4 - this.CALL_SUIT_SIZE / 2,
                          this.PLAYER_X_ARR[1] + this.PLAYER_SIZE * 3 / 4 - this.CALL_SUIT_SIZE / 2,
                          this.PLAYER_X_ARR[2] + this.PLAYER_SIZE * 3 / 4 - this.CALL_SUIT_SIZE / 2,
                          this.PLAYER_X_ARR[3] + this.PLAYER_SIZE * 3 / 4 - this.CALL_SUIT_SIZE / 2];

  this.CALL_SUIT_Y_ARR = [this.PLAYER_Y_ARR[0] - this.PLAYER_VERT_PADDING - this.CALL_SUIT_SIZE,
                          this.PLAYER_Y_ARR[1] - this.PLAYER_VERT_PADDING - this.CALL_SUIT_SIZE,
                          this.PLAYER_Y_ARR[2] + this.PLAYER_SIZE + this.PLAYER_VERT_PADDING,
                          this.PLAYER_Y_ARR[3] - this.PLAYER_VERT_PADDING - this.CALL_SUIT_SIZE];


  this.CALL_NUM_X_ARR = [this.PLAYER_X_ARR[0] + this.PLAYER_SIZE / 4,
                         this.PLAYER_X_ARR[1] + this.PLAYER_SIZE / 4,
                         this.PLAYER_X_ARR[2] + this.PLAYER_SIZE / 4,
                         this.PLAYER_X_ARR[3] + this.PLAYER_SIZE / 4];
  this.CALL_NUM_Y_ARR = [this.CALL_SUIT_Y_ARR[0] + this.TEXT_HEIGHT,
                         this.CALL_SUIT_Y_ARR[1] + this.TEXT_HEIGHT,
                         this.CALL_SUIT_Y_ARR[2] + this.TEXT_HEIGHT,
                         this.CALL_SUIT_Y_ARR[3] + this.TEXT_HEIGHT];

  this.HOVER_SIZE = this.CALL_SUIT_SIZE;
  this.HOVER_X_ARR = [this.PLAYER_X_ARR[0] + this.PLAYER_SIZE / 2 - this.HOVER_SIZE/2,
                      this.PLAYER_X_ARR[1] + this.PLAYER_SIZE / 2 - this.HOVER_SIZE/2,
                      this.PLAYER_X_ARR[2] + this.PLAYER_SIZE / 2 - this.HOVER_SIZE/2,
                      this.PLAYER_X_ARR[3] + this.PLAYER_SIZE / 2 - this.HOVER_SIZE/2];

  this.HOVER_Y_ARR = this.CALL_SUIT_Y_ARR;

  this.MESSAGE_X = this.CARD_AREA_X_0/2;
  this.MESSAGE_Y = this.CARD_AREA_Y_0 + this.CARD_HEIGHT / 2;

  this.PLAYER_MOVE_ANIMATE_TIME = 500;
  this.PLAYER_CARD_ANIMATE_TIME = 30;

  this.SCORE_PADDING = 20;
  this.SCORE_FLAG_SIZE = 32;
  this.SCORE_FLAG_X = [this.WIDTH - this.SCORE_FLAG_SIZE - 2*this.SCORE_PADDING, this.WIDTH - this.SCORE_FLAG_SIZE - 2*this.SCORE_PADDING];
  this.SCORE_FLAG_Y = [this.SCORE_PADDING, this.SCORE_PADDING + this.SCORE_FLAG_SIZE];

  this.SCORE_FONT_SIZE = 20;
  this.SCORE_TEXT_PADDING = 15;
  this.SUIT_TRANSLATION_TABLE = { 'DIAMONDS' : 'd', 'CLUBS' : 'c', 'SPADES' : 's', 'HEARTS' : 'h'};
  this.RANK_TRANSLATION_TABLE = [undefined, undefined, '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
}

var constants = new Constants();
