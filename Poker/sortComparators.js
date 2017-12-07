/* global localStorage */
function sortPrimary(user1, user2){
    let sortedType = localStorage.getItem('sortedType');
    
    if (sortedType === 'name' || sortedType === 'cc_username' || sortedType === 'site' || sortedType === 'role' || sortedType === 'supervisor'){
        //If any of the column values have the same value, then sort them by last name.
        if (user1[sortedType] === user2[sortedType]) {
            return sortSecondary(user1, user2);
        }
        
        let userStr1 = user1[sortedType];
        let userStr2 = user2[sortedType];
        if (userStr1 < userStr2) return -1;
        if (userStr1 > userStr2) return 1;
        return 0;
    }
    else if (sortedType === 'potential_bonus' || sortedType === 'YTD_chips' || sortedType === 'chips' || sortedType ==='extraCards'){
        //If any of the column values have the same value, then sort them by last name.
        if (user1[sortedType] === user2[sortedType]) {
            return sortSecondary(user2, user1);
        }
        return user1[sortedType] - user2[sortedType];
    }
    else if (sortedType === 'mane' || sortedType === 'pdpne' || sortedType === 'mapc' || sortedType === 'pdppc' || sortedType === 'xfrEnr' || 
                sortedType === 'hv' || sortedType === 'lacb' || sortedType === 'kits' || sortedType === 'rsvp'){
        //If any of the column values have the same value, then sort them by last name.
        if (user1[sortedType] === user2[sortedType]) {
            if (user1["YTD_" + sortedType] === user2["YTD_" + sortedType]) {
                return sortSecondary(user2, user1);
            }
            return user1["YTD_" + sortedType] - user2["YTD_" + sortedType];
        }
        return user1[sortedType] - user2[sortedType];
    }
    else if (sortedType === 'cardCount'){
        //If any of the column values have the same value, then sort them by last name.
        if (user1["cards"].length === user2["cards"].length) {
            return sortSecondary(user2, user1);
        }
        return user1["cards"].length - user2["cards"].length;
    }
}//End sortPrimary

function sortSecondary(user1, user2){
    let sortedType = localStorage.getItem('sortedType');
    
    if (sortedType === 'name' && user1['lname'] === user2['lname']){
        let studentStr1 = user1['fname'];
        let studentStr2 = user2['fname'];
        if (studentStr1 < studentStr2) return -1;
        if (studentStr1 > studentStr2) return 1;
        return 0;
    }
    let userStr1 = user1['lname'];
    let userStr2 = user2['lname'];
    if (userStr1 < userStr2) return -1;
    if (userStr1 > userStr2) return 1;
    return 0;
}

function sortCards(card1, card2){
    if (card1['number'] < card2['number']) return -1;
    else if (card1['number'] > card2['number']) return 1;
    return 0;
}
