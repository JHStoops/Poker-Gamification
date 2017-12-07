//global variables
users =[];
const SITE_ABBR = {
    'PRV': 'Provo',
    'MEM': 'Memphis',
    'SUN': 'Sunrise',
    'SAW': 'Plantation',
    'SAT': 'San Antonio',
    'SLC': 'Salt Lake City'
};
 
describe("updateUsersArray(sup)", function(){
    it("Grabs only agents from individual sites and are Aetna", function(){
        sessionStorage.setItem("client", "Aetna");
        localStorage.setItem('sortBy', 'site');
        for (let site in SITE_ABBR){
            updateUsersArray(site);
            users.sort(sortPrimary);
        
if(users[0].client != 'Aetna') console.log(users[0].site + ", " + users[0].client + 2);
if(users[1].client != 'Aetna') console.log(users[1].site + ", " + users[1].client + 2);
if(users[users.length-1].client === 'Aetna') console.log(users[users.length-1].site + ", " + users[users.length-1].client + 2);
if(users[users.length-2].client === 'Aetna') console.log(users[users.length-2].site + ", " + users[users.length-2].client + 2);

            expect(users[0].site === SITE_ABBR[site]).toBe(true);
            expect(users[0].client === 'Aetna').toBe(true);
            expect(users[1].site === SITE_ABBR[site]).toBe(true);
            expect(users[1].client === 'Aetna').toBe(true);
            expect(users[users.length-2].site === SITE_ABBR[site]).toBe(true);
            expect(users[users.length-2].client === 'Aetna').toBe(true);
            expect(users[users.length-1].site === SITE_ABBR[site]).toBe(true);
            expect(users[users.length-1].client === 'Aetna').toBe(true);
        }
    });
});

/*
logout()
verifySession()
verifyCredentials()
setUpGUI(doc)
renderNavHTML()
createTiles(doc)
updateAgentOverview()
createTable()
fillTable(sortedUsers)
activateGeneralListeners()
activateTileListeners()
activateRecordListeners()
toggleSortUI()
hideAscDesc()
sortAndFillUserTable()
cardNumberToLetter(num)
searchUsersByID(_id)
displayMessage(message, isGood)
updateUsersArray(sup)
updateUserCards(agents)
getYesterdaysHands()
*/