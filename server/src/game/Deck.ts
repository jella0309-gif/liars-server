import { Card, VALUES, SUITS, RED_SUITS } from '@liars-bar/shared';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.build();
    this.shuffle();
  }

  private build() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const val of VALUES) {
        this.cards.push({
          val,
          suit,
          isRed: RED_SUITS.includes(suit as any),
        });
      }
    }
  }

  public shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public draw(count: number): Card[] {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      const card = this.cards.pop();
      if (card) {
        drawn.push(card);
      }
    }
    return drawn;
  }

  get remaining(): number {
    return this.cards.length;
  }
}
