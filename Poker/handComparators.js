function sortHands(user1, user2){
    //Determine value of users' hands
    var cards1 = JSON.parse(JSON.stringify(user1.cards));
    var cards2 = JSON.parse(JSON.stringify(user2.cards));

    var hand1 = handValue(cards1);
    var hand2 = handValue(cards2);
    
    if (hand1.handCode === 0 && hand2.handCode === 0) return 0;
    else if (hand1.handCode === 0) return 1;
    else if (hand2.handCode === 0) return -1;
    else if (hand1.handCode < hand2.handCode) return 1;
    else if (hand1.handCode > hand2.handCode) return -1;
    else if (hand1.sum < hand2.sum) return 1;
    else if (hand1.sum > hand2.sum) return -1;
    //These hand codes are for 5-card combos. If the sum and handcode are the same, then there's no tie breaker.
    else if (hand1.handCode === 5 || hand1.handCode === 6 || hand1.handCode === 7 || 
        hand1.handCode === 9 || hand1.handCode === 10 || hand1.handCode === 11) return 0;

    //if handcode, sum, and enrollment count are all the same! Go by the next highest card value
    //tieBreaker() removes the cards that have already been compared to compare the next-best cards, until no cards remain.
    for (let i = 0; i < 4; i++){
        tieBreaker();
        if (hand1.handCode === 0 && hand2.handCode === 0) return 0;
        else if (hand1.handCode === 0) return 1;
        else if (hand2.handCode === 0) return -1;
        else if (hand1.sum < hand2.sum) return 1;
        else if (hand1.sum > hand2.sum) return -1;
    }

    return 0;

    function tieBreaker(){
        if (hand1.handCode === 1) {
            cards1 = removeAccountedCards(cards1, 1);
            cards2 = removeAccountedCards(cards2, 1);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 2) {
            cards1 = removeAccountedCards(cards1, 2);  
            cards2 = removeAccountedCards(cards2, 2);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 4) {
            cards1 = removeAccountedCards(cards1, 3);  
            cards2 = removeAccountedCards(cards2, 3);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 8) {
            cards1 = removeAccountedCards(cards1, 4);  
            cards2 = removeAccountedCards(cards2, 4);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
    }

    function removeAccountedCards(cards, divideBy){
        let temp = [];
        for (let card of cards) if (card.num != (hand2.sum / divideBy )) temp.push(card);
        return temp;
    }
}

function handValue(cards){
    //Map out contents of cards in hand
    if (cards.length === 0) return {handCode: 0, sum:0}; //Fail code
    var hand = cardCounter(cards), temp = {}, flushBool = false;
    
    //Check for flush
    for (var i = 0; i < cards.length - 1; i++){
        if (cards[i].suit !== cards[i + 1].suit) break;
        if (i === cards.length - 2) flushBool = true;
    }
    
    //Check for hand value - 1: high card, 2: pair, 3: two pairs, etc...
    var best = {};  //hand code, sum
    if (cards.length >= 1) {
        best = highCard(hand);
        
        if (cards.length >= 2) {
            temp = pair(hand);                          if (temp.handCode === 2 && temp.handCode > best.handCode) best = temp;
            
            if (cards.length >= 3) {
                temp = threeAlike(hand);                if (temp.handCode === 4 && temp.handCode > best.handCode) best = temp;

                if (cards.length >= 4) {
                    temp = twoPairs(hand);              if (temp.handCode === 3 && temp.handCode > best.handCode) best = temp;
                    temp = fourAlike(hand);             if (temp.handCode === 8 && temp.handCode > best.handCode) best = temp;
                    
                    if (cards.length === 5) {
                        temp = straight(hand);          if (temp.handCode === 5 && temp.handCode > best.handCode) best = temp;
                        temp = fiveAlike(hand);         if (temp.handCode === 10 && temp.handCode > best.handCode) best = temp;
                        temp = fullHouse(hand);         if (temp.handCode === 7 && temp.handCode > best.handCode) best = temp;
                        
                        if (flushBool){
                            temp = flush(hand);         if (temp.handCode === 6 && temp.handCode > best.handCode) best = temp;
                            temp = straightFlush(hand); if (temp.handCode === 9 && temp.handCode > best.handCode) best = temp;
                            temp = royalFlush(hand);    if (temp.handCode === 11 && temp.handCode > best.handCode) best = temp;
                        }
                    }//End of cards.length === 5
                }//End of cards.length >= 4
            }//End of cards.length >=3
        }//End of cards.length >=2
    }//End of cards.length >=1
    return best;
}

function cardCounter(cards){
    //Count number of cards of each number
    hand = {};
    for (var card of cards) (hand[`${card.num}`] === undefined) ? hand[`${card.num}`] = 1 : hand[`${card.num}`] += 1;
    return hand;
}

function highCard(hand) {
    var best = {handCode: 1, sum:0};
    for (let attr in hand){
        if (Number(attr) > best.sum) best.sum = Number(attr);
    }
    if (best.sum === 0) return {handCode: 0, sum:0}; //Fail code
    return best;
}

function pair(hand) {
    var best = {handCode: 2, sum:0};
    for (let attr in hand){
        if (hand[attr] === 2) best.sum = Number(attr) * 2;
    }
    if (best.sum === 0) return {handCode: 0, sum:0}; //Fail code
    return best;
}

function twoPairs(hand){
    var best = {handCode: 3, sum:0};
    var firstPair = false;
    for (let attr in hand){
        if (hand[attr] === 2 && firstPair === false) {
            best.sum = Number(attr) * 2;
            firstPair = true;
        }
        else if (hand[attr] === 2 && firstPair === true) {
            best.sum += Number(attr) * 2;
            return best;
        }
    }
    return {handCode: 0, sum:0}; //Fail code
}

function threeAlike(hand){
    var best = {handCode: 4, sum:0};
    for (let attr in hand){
        if (hand[attr] === 3) {
            best.sum += Number(attr) * 3;
            return best;
        }
    }
    return {handCode: 0, sum:0}; //Fail code
}

function straight(hand) {
    var best = {handCode: 5, sum:0};
    var prevCard = 0;
    for (let attr in hand){
        if (hand[attr] > 1) return {handCode: 0, sum:0}; //Fail code
        if (prevCard === 0) prevCard = Number(attr);
        else if (Number(attr) != prevCard + 1) return {handCode: 0, sum:0}; //Fail code
        else if (hand[attr] === 1) prevCard = Number(attr);
        best.sum += Number(attr);
    }
    return best;
}

function flush(hand){
    var best = {handCode: 6, sum:0};
    for (let attr in hand)
        best.sum += Number(attr) * hand[attr];
    return best;
}

function fullHouse(hand){
    var best = {handCode: 7, sum:0};
    var two = pair(hand);
    var three = threeAlike(hand);
    if (two.sum === 0 || three.sum === 0) return {handCode: 0, sum:0}; //Fail code
    best.sum = two.sum + three.sum;
    return best;
}

function fourAlike(hand){
    var best = {handCode: 8, sum:0};
    for (let attr in hand){
        if (hand[attr] === 4) {
            best.sum += Number(attr) * 4;
            return best;
        }
    }
    return {handCode: 0, sum:0}; //Fail code
}

function straightFlush(hand){
    var best = {handCode: 9, sum:0};
    var str = straight(hand);
    if (str.sum === 0) return {handCode: 0, sum:0}; //Fail code
    best.sum = str.sum;
    return best;
}

function fiveAlike(hand){
    var best = {handCode: 10, sum:0};
    for (let attr in hand){
        if (hand[attr] === 5) {
            best.sum += Number(attr) * 5;
            return best;
        }
    }
    return {handCode: 0, sum:0}; //Fail code
}

function royalFlush(hand){
    var best = {handCode: 11, sum:0};
    var str = straight(hand);
    if (str.sum != 60) return {handCode: 0, sum:0}; //Fail code
    best.sum = str.sum;
    return best;
}