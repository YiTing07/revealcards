// Controller 設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

// 花色圖片
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png',  //黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png',  //紅心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png',  //方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png'  //梅花
]

// View
const view = {
  // 生成卡片內容，包含花色和數字
  // 牌背元件：遊戲初始化時會透過 view.displayCards 直接呼叫
  getCardElement (index) {
    return `<div data-index="${index}" class="card back"></div>`
  },

  // 牌面元件：使用者點擊時，才會由翻牌的函式來呼叫牌面
  getCardContent (index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <div class="card">
        <p>${number}</p>
        <img src="${symbol}">
        <p>${number}</p>
      </div>
    `
  },

  // 將1,11,12,13 轉換成對應的英文
  transformNumber (number) {
  switch (number) {
    case 1:
      return 'A'
    case 11:
      return 'J'
    case 12:
      return 'Q'
    case 13:
      return 'K'
    default:
      return number
  }
},
  
  // 選出 #cards 並抽換內容
  displayCards (indexes) {
    const rootElement = document.querySelector('#cards')
    // 原本：rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join("")，增加 const utility 後，修正如下
    // rootElement.innerHTML = utility.getRandomNumberArray(52).map(index => this.getCardElement(index)).join("")
    // 為了由 controller 來呼叫 utility.getRandomNumberArray，避免 view 和 utility 產生接觸，改成以下
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },

  //  優化：翻牌
  flipCards (...cards) {
    cards.map (card => {
      if (card.classList.contains('back')) {
      // 回傳正面
      card.classList.remove('back')
      card.innerHTML = this.getCardContent(Number(card.dataset.index))
      return
    }
      // 回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },

  // 優化
  pairCards (...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  
  // 分數
  renderScore(score) {
    document.querySelector('.score').textContent = `Score: ${score}`
  },

  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You're tried: ${times} times`
  },

  // 動畫特效
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), {once: true})
    })
  },

  // 結束畫面
  showGameFinished () {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Completed!</p>
      <p>Score: ${model.score}</p>
      <p>You're tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// Model 管理資料
const model = {
  // 被翻開的卡片，是個暫存的牌組，須隨時清空
  revealedCards: [],

  // 檢查配對
  isRevealedCardsMatched () {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  // 得分資料
  score: 0,
  triedTimes: 0

}


// 標記目前的遊戲狀態，之後由 controller 推進遊戲狀態
const controller = {
  // 在初始狀態設定為 FirstCardAwaits (還沒翻牌)
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards () {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 優化：調遣指派動作 (flipCards, pairCards, setTimeout)
  dispatchCardAction (card) {
    // 非牌背的卡片，則不執行此程式
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  // 優化：將 setTimeout 的動作獨立出來
  resetCards () {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

// 洗牌：隨機重組陣列
// 從最後面的牌開始，與前面的牌隨機交換。所以是index--
// 解構賦值語法(一定要保留分號)
const utility = {
  getRandomNumberArray (count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length-1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}


//view.displayCards ()
controller.generateCards()  //取代 view.displayCards ()
//為每張卡片加上 listener
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    // 原本：view.flipCard(card)，增加 controller 後，改為以下
    controller.dispatchCardAction(card)
  })
})


