(function() {

  
  var app = angular.module('deckbuilder', ['ngStorage']);

  app.filter('toArray', function () {
    'use strict';

    return function (obj) {
      if (!(obj instanceof Object)) {
        return obj;
      }

      return Object.keys(obj).map(function (key) {
        return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
      });
    };
      });
  
  app.factory('getData', function($http) {
    var promise;
    var getData = {
      async: function(file) {
        if ( !promise ) {
          // $http returns a promise, which has a then function, which also returns a promise
          promise = $http.get(file).then(function (response) {
            // The then function here is an opportunity to modify the response
            //console.log(response);
            // The return value gets picked up by the then in the controller.
            return response.data;
          });
        }
        // Return the promise to the controller
        return promise;
      }
    };
    return getData;
  });
  
  
  
  //Logic for the pack selection
  app.controller('packSelect',["filtersettings","$localStorage",function(filtersettings,$localStorage){
    this.filtersettings=filtersettings;
    this.full=["core", "kd", "hon", "voi", "tlr", "thohauh", "thfg", "trg", "tsf", "tdt", "twoe", "thotd", "catc", "rtr", "tdf", "ttt", "efmg", "tbr", "ajtr", "twitw", "eaad", "tit", "rd", "thoem", "tld", "aoo", "nie", "tdm", "fos", "tbog", "cs", "rtm", "saf", "tmv", "tac", "tos", "tlos", "ate", "ttor", "tbocd", "tdr", "tgh"]; //all expansions so far
    this.toggle=function(exp){
      var ind = this.filtersettings.pack.indexOf(exp);
      if (ind<0) { //index will be -1 if not found
        this.filtersettings.pack.push(exp);
      } else {
        this.filtersettings.pack.splice(ind,1);
      }
      $localStorage.pack = this.filtersettings.pack;
    };
    this.toggleonecore = function(){
      if(this.filtersettings.onecore){
        this.filtersettings.onecore=false;
      } else {
        this.filtersettings.onecore=true;
      }
      if(this.filtersettings.twocore){
        this.filtersettings.twocore=false;
      }
      $localStorage.onecore = this.filtersettings.onecore;
    };
    this.toggletwocore = function(){
      if(this.filtersettings.twocore){
        this.filtersettings.twocore=false;
      } else {
        this.filtersettings.twocore=true;
      }
      if(this.filtersettings.onecore){
        this.filtersettings.onecore=false;
      }
      $localStorage.twocore = this.filtersettings.twocore;
    }
    this.selectNone=function(){
      this.filtersettings.pack=[];
      $localStorage.pack = this.filtersettings.pack;
    };
    this.selectAll=function(){
      this.filtersettings.pack=this.full.slice(0); //make a clone
      $localStorage.pack = this.filtersettings.pack;
    };
  }]);
  
  app.directive('about', function() {
    return {
      restrict: 'E',
      templateUrl: 'about.html'
    };
  });
  
  app.directive('news', function() {
    return {
      restrict: 'E',
      templateUrl: 'news.html'
    };
  });

  app.directive('packs', function() {
    return {
      restrict: 'E',
      templateUrl: 'packs.html',
      controller: 'packSelect',
      controllerAs: 'packs'
    };
  });

  app.directive('auto', function() {
    return {
      restrict: 'E',
      templateUrl: 'auto.html',
    };
  });
  
  //Tabs in the right div
  app.controller('tabController',[function(){
    this.tab=1;
    this.setTab = function(newValue){
      this.tab = newValue;
    };
    this.isSet = function(tabName){
      return this.tab === tabName;
    };
  }]);
  
  
  app.controller('init',['getData','$location','deck','cardObject','$scope',function(getData,$location,deck,cardObject,$scope){
    
    getData.async('cards.json').then(function(data) {
      for (var d in data) {
        cardObject.push(data[d]);
      }
    });

    setTimeout( function() {
      var hashIndex = $location.url().indexOf('/#');
      if (hashIndex>-1){
        var encoded = $location.url().substr(hashIndex+2);
        var decoded = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded));
        deck.load(decoded,cardObject);
      }
      $scope.$apply();
    },1000);
  }]);
  
  
  //Page header
  app.directive('header', function() {
    return {
      restrict: 'E',
      templateUrl: 'header.html',
      controller: 'init'
    };
  });
  //Page footer
  app.directive('myfooter', function() {
    return {
      restrict: 'E',
      templateUrl: 'footer.html'
    };
  });
  
  app.filter('cardfilter', function(){
    return function (input, scope) {
      var output=[];
      for (var i in input){
        if ((scope.filtersettings.pack.indexOf(input[i].exp)>=0)
          && (scope.filtersettings.type[input[i].type])
          && (scope.filtersettings.spheres[input[i].sphere]))
          {output.push(input[i]);}
      }
      return output;
    };
  });
  
  app.factory('filtersettings',["$localStorage",function ($localStorage) {
    var filtersettings={};
    filtersettings.onecore = $localStorage.onecore;
    filtersettings.twocore = $localStorage.twocore;
    filtersettings.pack= $localStorage.pack || ["core"];
    filtersettings.type={'1hero': true, '2ally': false, '3attachment': false, '4event': false, '5quest': false};
    filtersettings.spheres={'1leadership': true, '4lore': true, '3spirit': true, '2tactics': true, '5neutral': true, '6baggins':false, '7fellowship':false};
    return filtersettings;
  }]);
  
  
  app.factory('cardObject',["getData",function(getData){
    var cardObject = [];
    return cardObject;
  }]);
  
  //Logic for the card selection
  app.controller('cardControl',["$http","$scope","filtersettings","deck","suggested","image","cardObject",function($http,$scope,filtersettings,deck,suggested,image,cardObject){
    $scope.allcards=[];
    $scope.deck=deck;
    $scope.suggested=suggested;
    this.image = image;
    this.filtersettings=filtersettings;
    this.order=['sphere','name_norm'];
    $scope.allcards = cardObject;
    this.allcards = $scope.allcards;
    this.resetSearch = function(){
      filtersettings.search.name_norm="";
      filtersettings.search.traits="";
      filtersettings.search.textc="";
    };
    this.toggleType = function(t,$event){
      if($event.shiftKey){
        for (var type in this.filtersettings.type) {
          this.filtersettings.type[type] = false;
        }
      }
      this.filtersettings.type[t] = !(this.filtersettings.type[t]);
    };
    this.toggleSphere = function(s,$event){
      if($event.shiftKey){
        for (var sphere in this.filtersettings.spheres) {
          this.filtersettings.spheres[sphere] = false;
        }
      }
      this.filtersettings.spheres[s] = !(this.filtersettings.spheres[s]);
    };
    this.orderby = function(o){
      this.order = o;
    };
    this.changepreview = function(card){
      this.image.update(card);
    };
  }]);
  
  app.directive('cards', function() {
    return {
      restrict: 'E',
      templateUrl: 'cards.html',
      controller: 'cardControl',
      controllerAs: 'cards'
    };
  });
  
  app.directive('traits', function() {
    return {
      restrict: 'E',
      templateUrl: 'traitchoice.html'
    };
  });
  
  
  
  app.factory('deck', ['filtersettings','suggested','cardObject', function(filtersettings,suggested,cardObject){
    var deck={};
    deck.filtersettings = filtersettings;
    deck.suggested = suggested;
    deck.allcards = cardObject;
    deck['1hero']=[];
    deck['2ally']=[];
    deck['3attachment']=[];
    deck['4event']=[];
    deck['5quest']=[];
    
    deck.change = function(card,quantity){
      if (quantity>0){
	if (deck.quantity(card)==0) {
	  card.quantity=quantity;
          deck[card.type].push(card);
        } else {
          for (var c in deck[card.type]){
            if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
              deck[card.type][c].quantity = quantity;
            }
          }
        }
      } else {
        for (var c in deck[card.type]){
            if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
              deck[card.type].splice(c, 1);
            }
          }
      }
      // Get list of suggestions for deck
      suggested.deckChange(this);
    };
    deck.quantity = function(card){
      for (var c in deck[card.type]){
        if (deck[card.type][c].cycle==card.cycle && deck[card.type][c].no==card.no){
          return deck[card.type][c].quantity;
        }
      }
      return 0;
    };
    deck.startingThreat = function(){
      var threat = 0;
      var mirlonde = 0;
      var loreheroes = 0;
      for(var h in deck['1hero']){
        threat += deck['1hero'][h].cost;
	if(deck['1hero'][h].name_norm=="Mirlonde")
	    mirlonde = 1;
	if(deck['1hero'][h].sphere=="4lore")
	    loreheroes++;
      }
      if(mirlonde) threat-=loreheroes;
      return threat;
    };
    
    deck.countAllies = function(){
      var allies=0;
      for (var a in deck['2ally']) {
        allies += deck['2ally'][a].quantity;
      }
      return allies;
    };
    deck.countAttachments = function(){
      var attachments=0;
      for (var a in deck['3attachment']) {
        attachments += deck['3attachment'][a].quantity;
      }
      return attachments;
    };
    deck.countEvents = function(){
      var events=0;
      for (var e in deck['4event']) {
        events += deck['4event'][e].quantity;
      }
      return events;
    };
    deck.countQuests = function(){
      var quests=0;
      for (var q in deck['5quest']) {
        quests += deck['5quest'][q].quantity;
      }
      return quests;
    };
    deck.countHeroes = function(){
      var heroes=0;
      for (var h in deck['1hero']) {
        heroes += deck['1hero'][h].quantity;
      }
      return heroes;
    };
    
    deck.countTotal = function() {
      return deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests();
    };
    
    deck.empty = function() {
      return (deck.countAllies()+deck.countAttachments()+deck.countEvents()+deck.countQuests()+deck.countHeroes())==0;
    };

    deck.load = function(deckArray,cardObject,deckname,decknotes) {
      if (Object.prototype.toString.apply(deckArray) == "[object Object]") {
        deck.deckname = deckname;
        deck.decknotes = decknotes;
        deck.loadLegacy(deckArray);
        return 0;
        
      }
      deck['1hero']=[];
      deck['2ally']=[];
      deck['3attachment']=[];
      deck['4event']=[];
      deck['5quest']=[];
      deck.deckname = deckArray[0];
      deck.decknotes = decknotes;
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      suggested.clearBlacklist();
      suggested.deckChange(this);
    };
    
    deck.loadLegacy = function(deckObject) {
      deck['1hero']=deckObject['1hero'];
      deck['2ally']=deckObject['2ally'];
      deck['3attachment']=deckObject['3attachment'];
      deck['4event']=deckObject['4event'];
      deck['5quest']=deckObject['5quest'];
    };
    
    
    return deck;
  }]);
  
  app.controller('deckController',['$scope','deck','image',function($scope,deck,image){
    $scope.deck=deck;
    this.changepreview = function(card){
      image.update(card);
    };
  }]);
  
  app.directive('deck', function() {
    return {
      restrict: 'E',
      templateUrl: 'deck.html',
      controller: 'deckController',
      controllerAs: 'deckC'
    };
  });

  app.factory('style',function(){
    style={};
    style.clear = function() {
      style.width = undefined,
      style.minwidth = undefined,
      style.left = undefined,
      style.preview = undefined,
      style.right = undefined;
    };
    return style;
  });

  app.factory('suggested', ['filtersettings','cardObject','style','$rootScope',function(filtersettings,cardObject,style,$rootScope){
      $rootScope.style = style;
      var suggested={};
      suggested.hidden=0;
      suggested.deck=[];
      suggested.filtersettings = filtersettings;
      suggested.allcards = cardObject;
      suggested['sphere']=[];
      suggested['1hero']=[];
      suggested['2ally']=[];
      suggested['3attachment']=[];
      suggested['4event']=[];
      suggested['5quest']=[];
      suggested['traits']=['Dwarf','Rohan','Silvan','Noldor','Gondor','Ent','Eagle','Dunedain','Hobbit','Istari','Outlands','Ranger','Scout','Outlands','Ranged','Sentinel','Weapon'];
      suggested.targetsInDeck=[];
      suggested.targetOptionsForDeck=[];
      suggested.traitSpecificTargetsInDeck=[];
      suggested.traitSpecificTargetOptionsForDeck=[];
      suggested.blacklist=[];
      suggested.staples=[
	  {name_norm: "A Test of Will", exp: "core"},
	  {name_norm: "Hasty Stroke", exp: "core"},
	  {name_norm: "Steward of Gondor", exp: "core"},
	  {name_norm: "Unexpected Courage", exp: "core"},
	  {name_norm: "Daeron's Runes", exp: "fos"},
	  {name_norm: "Deep Knowledge", exp: "voi"},
	  {name_norm: "Feint", exp: "core"},
	  {name_norm: "Quick Strike", exp: "core"},
	  {name_norm: "Foe-hammer", exp: "thohauh"}
      ];

      // This is the main function, it gets called whenever the cards in the deck change and updates the suggestions
      suggested.deckChange = function(deck) {
          if (suggested.hidden){
            return 0; //Don't do anything if suggestions are hidden, saves memory
          }
	  suggested.deck=deck;
	  // Clear the suggestions
	  suggested['1hero']=[];
	  suggested['2ally']=[];
	  suggested['3attachment']=[];
	  suggested['4event']=[];
	  suggested['5quest']=[];
	  // Set the spheres that the deck has access to
	  suggested.setSpheres();
	  // Set the list of target options in the deck
	  suggested.setTargetsInDeck();
	  suggested.setTraitSpecificTargetsInDeck();
	  suggested.setTargetOptionsForDeck();
	  suggested.setTraitSpecificTargetOptionsForDeck();
	  // Loop over all the cards and see if they should be suggested
	  var suggestions=[]; // List of cards to suggest
	  for(var c in suggested.allcards) {
	      var cardc = suggested.allcards[c];
	      var traitSpecificTargetsInCard = suggested.getTraitSpecificTargetsInCard(cardc);
	      var traitSpecificTargetOptionsForCard = suggested.getTraitSpecificTargetOptionsForCard(cardc);
	      // Suggest card if it's a staple
	      for(var s in suggested.staples) {
	  if (cardc.name_norm==suggested.staples[s].name_norm && cardc.exp==suggested.staples[s].exp) {
	      suggestions.push(cardc);
	  }
	      }
	      // Suggest cards that have a hero's name in the text
	      for(var h in deck['1hero']) {
	      	  var heroname = deck['1hero'][h].name;
	      	  if(suggested.isWordInString(heroname+'.',cardc.text) || suggested.isWordInString(heroname+' ',cardc.text) || suggested.isWordInString(heroname+',',cardc.text)) {
	      	      suggestions.push(cardc);
	      	  }
	      }
	      // Suggest Trap cards for Damrod
	      if (suggested.isInDeck('Damrod','tlos') && suggested.isWordInString('Trap',cardc.traits)) {
	      	  suggestions.push(cardc);
	      }
	      
	      // Suggest heal/hit point cards for Gloin, Treebeard, Gimil
	      if ( (suggested.isInDeck('Gloin','core') || suggested.isInDeck('Gimli','core') || suggested.isInDeck('Treebeard','tos')) && (suggested.isWordInString('heal',cardc.text) || suggested.isWordInString('hit point',cardc.text)) )
	      	  suggestions.push(cardc);

	      // Suggest healing cards for Elrond
	      if (suggested.isInDeck('Elrond','saf') && suggested.isWordInString('heal',cardc.text))
	      	  suggestions.push(cardc);
	      // Suggest high cost cards for Vilya
	      if (suggested.isInDeck('Vilya','saf') && cardc.cost>=4 && cardc.type!='1hero')
	  suggested.add(cardc); // Bypass basic checks

	      // Suggest spirit heroes for Caldara
	      if (suggested.isInDeck('Caldara','tbog') && cardc.sphere=='3spirit' && cardc.type=='1hero')
	      	  suggestions.push(cardc);
	      // Suggest tactics heroes for Thoeden
	      if (suggested.isInDeck('Theoden','tmv') && cardc.sphere=='2tactics' && cardc.type=='1hero')
	      	  suggestions.push(cardc);

	      // Suggest victory display for Rossiel
	      if (suggested.isInDeck('Rossiel','efmg') && suggested.isWordInString('victory',cardc.text))
	      	  suggestions.push(cardc);


	      // Suggest doomed for Grima
	      if (suggested.isInDeck('Grima','voi') || suggested.isInDeck('Grima hero','voi') && (suggested.isWordInString('oomed',cardc.text)||suggested.isWordInString('oomed',cardc.keywords)))
	      	  suggestions.push(cardc);
	      // Suggest threat reudction for Boromir, Dunhere, or Hobbit Gandalf
	      if ((suggested.isInDeck('Boromir','tdm') || suggested.isInDeck('Gandalf','thohauh') || suggested.isInDeck('Dunhere','core')) && (/([L|l]ower|[R|r]educe)/.test(cardc.text)) && (/[T|t]hreat/.test(cardc.text)) && !(/[E|e]ncounter/.test(cardc.text)))
	  suggestions.push(cardc);
	      
	      // Suggest location cards for Idraen
	      if (suggested.isInDeck('Idraen','ttt') && suggested.isWordInString('explored',cardc.text))
	      	  suggestions.push(cardc);
	      if (suggested.isInDeck('Idraen','ttt') && suggested.isWordInString('progress',cardc.text) && suggested.isWordInString('location',cardc.text))
	      	  suggestions.push(cardc);
	      
	      // Sugest discard pile cards for Arwen or Erestor
	      if ((suggested.isInDeck('Arwen Undomiel','tdr')||suggested.isInDeck('Erestor','ttor')) && suggested.isWordInString('discard pile',cardc.text) && !suggested.isWordInString('encounter',cardc.text))
	      	  suggestions.push(cardc);

	      // Sugest encounter cards for Denethor
	      if (suggested.isInDeck('Denethor','core') && suggested.isWordInString('top',cardc.text) && suggested.isWordInString('encounter deck',cardc.text))
	      	  suggestions.push(cardc);

	      // Sugest Tactics Events for Hama
	      if (suggested.isInDeck('Hama','tld') && (cardc.sphere=='2tactics') && (cardc.type=='4event'))
	      	  suggestions.push(cardc);
	      
	      // Suggest weapon/armour for Beregond
	      if (suggested.isInDeck('Beregond','hon') && suggested.isWordInString('Weapon',cardc.traits))
	      	  suggestions.push(cardc);	    
	      if (suggested.isInDeck('Beregond','hon') && suggested.isWordInString('Armor',cardc.traits))
	      	  suggestions.push(cardc);	    
	      
	      // Suggest engage cards
	      if (suggested.isWordInDeck('engage ') && (suggested.isWordInCard('engage ',cardc) || suggested.isWordInCard('into play engaged',cardc)))
	      	  suggestions.push(cardc);
	      // Suggest engagement cost cards
	      if (suggested.isWordInDeck('engagement cost') && suggested.isWordInCard('engagement cost ',cardc))
	      	  suggestions.push(cardc);

	      // Suggest Dwarf Swarm cards
	      if (suggested.isWordInDeck('Dwarf characters') && suggested.isWordInString('Dwarf characters',cardc.text))
	      	  suggestions.push(cardc);

	      // Suggest mono sphere cards
	      if (suggested.monoSphere() && (/[E|e]ach hero you control/.test(cardc.text)) && suggested.isWordInString('icon',cardc.text))
	  suggestions.push(cardc);
	      if (suggested.monoSphere() && suggested.isWordInString('from 3 different',cardc.text))
	  suggestions.push(cardc);

	      // Suggest all allies of a trait if all the heroes have that trait
	      var monoTrait = suggested.monoTrait();
	      for (var t in monoTrait)
	  if (suggested.isWordInString(monoTrait[t],cardc.traits))
	      suggestions.push(cardc);
	      
	      // Suggest secrecy
	      if (suggested.isSecrecy() && (/[S|s]ecrecy/.test(cardc.textc)))
	  suggestions.push(cardc);	  
 
	      // Suggest Weapons for Warriors
	      if (suggested.isTraitInHeroTraits('Warrior') && suggested.isWordInCard('eapon',cardc) && (cardc.type=='3attachment'||cardc.type=='4event'))
	       	  suggestions.push(cardc);

	      // Troubleshooting
	      // if (cardc.name_norm=="The Day's Rising"){
	      // alert(suggested.targetListToString(suggested.targetOptionsForDeck));
	      // alert(suggested.targetListToString(traitSpecificTargetsInCard));
	      // }


	      // Suggest cards with similar traits. Example: If Eomund is in deck, suggest all characters with Rohan trait
	      if (suggested.matchInTargetLists(suggested.traitSpecificTargetsInDeck,traitSpecificTargetOptionsForCard))
	      	  suggestions.push(cardc);
	      if (suggested.matchInTargetLists(suggested.traitSpecificTargetOptionsForDeck,traitSpecificTargetsInCard))
	      	  suggestions.push(cardc);

	  }

	  // Loop over list of suggested cards
	  for(var c in suggestions) {
	      
	      var cardc = suggestions[c];
	      // Only suggest cards that are not already in suggested
	      if(suggested.isCardInList(cardc,suggested[cardc.type])) continue;
	      suggested.check(cardc);
	  }	  
      };

      // Check to make sure the card makes sense to suggest
      suggested.check = function(card) {
	  // Check if there is a hero with access to the necessary sphere to play the card
	  var propersphere=suggested.sphereAccess(card);
	  // Check if there is a proper target in the deck that can use the card
	  var propertarget=suggested.deckHasTargetOption(card);
	  // Cards that have been hand-picked to never be suggested
	  var vetolisted=suggested.isCardInVetoList(card.name_norm,card.exp);
	  
	  var debug = '';
	  if (vetolisted) return;
	  if (!propersphere && card.type!='1hero') return; // Hero suggestions are exempt from requiring a sphere match
	  if (card.sphere=='6baggins'||card.sphere=='7fellowship') return; // Never suggest cards of these spheres
	  if (!propertarget) return;
	  suggested.add(card);
      };

      // Final set of check before adding the card. Should not be bypassed.
      suggested.add = function(card) {
	  // Check is card is in blacklist
	  var blacklisted=suggested.isCardInList(card,suggested.blacklist);
	  // Check if there is an ally or hero with the same name already in the deck
	  var sameName=suggested.sameName(card);
	  // Check if card is in an available pack
	  var properexp=0;
	  for(var k in filtersettings.pack)
	      if(filtersettings.pack[k]==card.exp) properexp=1;

	  if (blacklisted) return;
	  if (sameName) return;
	  if (!properexp) return;

	  suggested[card.type].push(card);
	  
      };
      // Define the vetolist here
      suggested.isCardInVetoList = function(name,exp) {
	  if (name=='Pippin' && exp=='eaad') return 1;
	  else if (name=='The End Comes' && exp=='rtr') return 1;
	  return 0;
      };

      // Sets the list of spheres that the deck has access to
      suggested.setSpheres = function() {
	  var deck = suggested.deck;
          if (deck['1hero']==undefined) { deck['1hero']=[];}
	  suggested['sphere']=[];
	  for(var c in deck['1hero']) {
	      suggested['sphere'].push(deck['1hero'][c].sphere);
	  }
	  if(deck['1hero'].length>0) suggested['sphere'].push('5neutral');
	  if(suggested.isInDeck('Oin','thotd'))
	      suggested['sphere'].push('2tactics');
	  if(suggested.isInDeck('Amarthiul','tbocd'))
	      suggested['sphere'].push('2tactics');
	  
      };

      // Returns true if deck has access to given sphere
      suggested.sphereAccess = function(card) {
	  var sphere = card.sphere;
	  for (var s in suggested['sphere'])
	      if(suggested['sphere'][s]==sphere)
	  return 1;
	  // Special cases
	  if (suggested.isInDeck('Elrond','saf') && card.type=='2ally')
	      return 1;
	  if (suggested.isInDeck('Hirluin the Fair','tsf') && card.type=='2ally' && suggested.isWordInString('Outlands',card.traits))
	      return 1;
	  return 0;
      };
      
      
      
      // Returns 1 if the deck has an eligible target for the card
      suggested.deckHasTargetOption = function(card) {
	  var targetsincard = suggested.getTargetsInCard(card);
	  // Just have to macth one of the targets in the card with a targetoption for the deck
	  if (targetsincard.length==0) return 1;
	  for (var t in targetsincard)
	      if (suggested.isTargetInList(targetsincard[t],suggested.targetOptionsForDeck))
	   	  return 1;
	  return 0;
      };
      
      // Returns list of target options for the card. If Core Gloin was the card, the returned list would look like:
      // [{trait:'None',type:'hero'},
      //  {trait:'None',type:'character'},
      //  {trait:'Leadership',type:'hero'},
      //  {trait:'Leadership',type:'character'},
      //  {trait:'Dwarf',type:'hero'},
      //  {trait:'Dwarf',type:'character'},
      //  {trait:'Noble',type:'hero'},
      //  {trait:'Noble',type:'character'}]
      suggested.getTargetOptionsForCard = function(card) {
	  // Special case
	  if (card.name_norm=='Beorn' && card.exp=='thohauh') return []; // Beorn cannot be a target option for any player card
	  // 
	  var targets = [];
	  var regextrait = /([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)/g;
	  var typen = suggested.normalize(card.type);
	  targets.push({trait:'None',type:typen});
	  targets.push({trait:'None',type:'character'});
	  targets.push({trait:suggested.normalize(card.sphere),type:typen});
	  targets.push({trait:suggested.normalize(card.sphere),type:'character'});
	  var match = regextrait.exec(card.traits);
	  while (match != null) {
	      targets.push({trait:match[0],type:typen});
	      targets.push({trait:match[0],type:'character'});
	      match = regextrait.exec(card.traits);
	  }
	  if (suggested.isWordInString('Ranged',card.keywords)) {
	      targets.push({trait:'Ranged',type:typen});
	      targets.push({trait:'Ranged',type:'character'});
	  }
	  if (suggested.isWordInString('Sentinel',card.keywords)) {
	      targets.push({trait:'Sentinel',type:typen});
	      targets.push({trait:'Sentinel',type:'character'});
	  }
	  return targets;
      };

      suggested.getTraitSpecificTargetOptionsForCard = function(card) {
	  return suggested.traitSpecificFilter(suggested.getTargetOptionsForCard(card));
      };
      
      // Returns a list of targets that are in the card and specific to the given trait
      suggested.getTraitSpecificTargetsInCard = function(card) {
	  return suggested.traitSpecificFilter(suggested.getTargetsInCard(card));
      };

      // Filter out all targets that are not one of the globally named traits
      suggested.traitSpecificFilter = function(list) {
	  targets = [];
	  for (var t in list)
	      if (suggested.isWordInList(list[t].trait,suggested.traits))
	  targets.push(list[t]);
	  return targets;
      };

      // Sets list of targets in the deck
      suggested.setTargetsInDeck = function() {
	  var deck = suggested.deck;
	  var targets = [];
	  // Loop over cards
	  var types = ['1hero','2ally','3attachment','4event','5quest'];
	  for (var t in types)
	      for (var c in deck[types[t]]) {
	  var newtargets = suggested.getTargetsInCard(deck[types[t]][c]);
	  targets=targets.concat(newtargets);
	      }
	  suggested.targetsInDeck = targets;
      };

      // Sets list of targets in the deck that specify one of the globally named traits
      suggested.setTraitSpecificTargetsInDeck = function() {
	  var deck = suggested.deck;
	  suggested.traitSpecificTargetsInDeck = suggested.traitSpecificFilter(suggested.targetsInDeck);
      };
            
      // Sets list of targets options for the deck.
      suggested.setTargetOptionsForDeck = function() {
	  var deck = suggested.deck;
	  var targets = [];
	  var regextrait = /([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)/g;
	  // Loop over cards
	  var types = ['1hero','2ally','3attachment'];
	  for (var t in types)
	      for (var c in deck[types[t]]) {
	  var newtargets = suggested.getTargetOptionsForCard(deck[types[t]][c]);
	  targets=targets.concat(newtargets);
	  
	      }
	  suggested.targetOptionsForDeck = targets;
      };

      // Sets list of targets options for the deck that have one of the globally named traits
      suggested.setTraitSpecificTargetOptionsForDeck = function() {
	  var deck = suggested.deck;
	  suggested.traitSpecificTargetOptionsForDeck = suggested.traitSpecificFilter(suggested.targetOptionsForDeck);
      };

      // Convert list of targets to a printable string
      suggested.targetListToString = function(list) {
	  var string = '';
	  for (var t in list) {
	      var target = list[t];
	      string=string+target.trait+' '+target.type+' / ';
	  }
	  return string;	      
      };
      
      // Checks if a target is in a list of targets
      suggested.isTargetInList = function(target,list) {
	  for (var t in list)
	      if (target.trait==list[t].trait && target.type==list[t].type)
	  return 1;
	  return 0;
      };
      
      // Returns 1 if there is a target in listA that matches a target in listB
      suggested.matchInTargetLists = function(listA,listB) {
	  for (var t in listA)
	      if (suggested.isTargetInList(listA[t],listB))
	  return 1;
	  return 0;
      };
      
      // Converts '2tactics' to 'Tactics', etc.
      suggested.normalize = function(word) {
	  if (word=='1leadership') return 'Leadership';
	  if (word=='2tactics') return 'Tactics';
	  if (word=='3spirit') return 'Spirit';
	  if (word=='4lore') return 'Lore';
	  if (word=='5neutral') return 'Neutral';
	  if (word=='6baggins') return 'Baggins';
	  if (word=='7fellowship') return 'Fellowship';
	  if (word=='1hero') return 'hero';
	  if (word=='2ally') return 'ally';
	  if (word=='3attachment') return 'attachment';
	  if (word=='4event') return 'event';
	  if (word=='5quest') return 'quest';
	  return '';
      };

      // Returns list of targets targetted by the card text
      suggested.getTargetsInCard = function(card) {
	  var targets = []; // List of targets named by the card. 
	  // A returned list for Quick Ears would look like [{trait:'Dunedain',type:'hero'},{trait:'Ranger',type:'hero'}]
	  // A returned list for Unexpected Courage would look like [{trait:'None',type:'hero'}]
	  // A returned list for Spear of the Citadel would look like [{trait:'Tactics',type:'character'}]
	  // A returned list for Valiant Sacrifice would be [{trait:none,type:'ally'}]

	  // Special cases
	  if (card.name_norm=='Radagast' && card.exp=='ajtr') {
	      targets.push({trait:'Creature',type:'hero'});
	      targets.push({trait:'Creature',type:'ally'});
	      targets.push({trait:'Creature',type:'character'});
	      return targets;
	  }
	  if (card.name_norm=='Nori' && card.exp=='thohauh') {
	      targets.push({trait:'Dwarf',type:'ally'});
	      return targets;
	  }
	  if (card.name_norm=='Boromir' && card.exp=='hon') {
	      targets.push({trait:'Gondor',type:'ally'});
	      return targets;
	  }
	  if (card.name_norm=='Hirluin the Fair' && card.exp=='tsf') {
	      targets.push({trait:'Outlands',type:'ally'});
	      return targets;
	  }

	  // Match certain attachments
	  var atraitattachment = /(?:(?:a|an|1) )([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+) (?:or )?([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)? ?(?:attachment|card attached)/.exec(card.text);
	  if (atraitattachment) {
	      if (atraitattachment[1])
	  targets.push({trait:atraitattachment[1],type:'attachment'});
	      if (atraitattachment[2])
	  targets.push({trait:atraitattachment[2],type:'attachment'});
	      return targets;
	  }

	  // Match targets like 'a hero'
	  var acharacter = /(?: (?:a|an|1)) (hero|character|ally)(?! (?:you control )?with)/.exec(card.text);
	  if (acharacter) targets.push({trait:'None',type:acharacter[1]});
	  
	  // Match targets like 'a Ranger hero'
	  var atraithero = /(?:(?:a|an|1|Each|each) )([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+) (?:or )?([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)? ?(?:hero)/.exec(card.text);
	  if (atraithero) {
	      if (atraithero[1])
	  targets.push({trait:atraithero[1],type:'hero'});
	      if (atraithero[2])
	  targets.push({trait:atraithero[2],type:'hero'});
	  }
	  var atraitally = /(?:(?:a|an|1|first) )([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+) (?:or )?([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)? ?(?:ally)/.exec(card.text);
	  if (atraitally) {
	      if (atraitally[1])
	  targets.push({trait:atraitally[1],type:'ally'});
	      if (atraitally[2])
	  targets.push({trait:atraitally[2],type:'ally'});
	  }
	  var atraitcharacter = /(?:(?:a|an|1|defending|of|unique) )([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+) (?:or )?([A-Z][\u00BF-\u1FFF\u2C00-\uD7FF\w]+)? ?(?:character|deals|cards|you control)/.exec(card.text);
	  if (atraitcharacter) {
	      if (atraitcharacter[1]) {
	  targets.push({trait:atraitcharacter[1],type:'character'});
	      }
	      if (atraitcharacter[2]) {
	  targets.push({trait:atraitcharacter[2],type:'character'});
	      }
	  }
	  // Match cards like 'with ranged' or 'sentinel character'
	  var withranged = /(hero|character).+with (the |printed )?([R|r]anged)/.exec(card.text);
	  if (withranged) {
	      targets.push({trait:'Ranged',type:withranged[1]});  
	  }
	  var withsentinel = /(hero|character).+with (the |printed )?([S|s]entinel)/.exec(card.text);
	  if (withsentinel) {
	      targets.push({trait:'Sentinel',type:withsentinel[1]});	      
	  }
	  var rangedcharacter = /[R|r]ranged character/.exec(card.text);
	  if (rangedcharacter) {
	      targets.push({trait:'Ranged',type:'character'});    
	  }
	  var sentinelcharacter = /[S|s]entinel character/.exec(card.text);
	  if (sentinelcharacter) {
	      targets.push({trait:'Sentinel',type:'character'});	      
	  }

	  return targets;
      };

      // Force a card to be suggested, bypassing most checks. Done by name/exp.
      suggested.forceAdd = function(name_norm,exp) {
	  for(var c in suggested.allcards) {
	      var cardc = suggested.allcards[c];
	      if (cardc.name_norm==name_norm && cardc.exp==exp && !suggested.sameName(cardc))
	  suggested.add(card);
	  }
      };

      // Force a card to be suggested, bypassing most checks. Done by card.
      suggested.forceAddCard = function(card) {
	  suggested.add(card);
      };

      // Returns true if there is a in the deck by the same name as the given card
      suggested.sameName = function(card){
	  var deck = suggested.deck;
	  for (var c in deck[card.type]){
	      if (deck[card.type][c].name_norm==card.name_norm){
	  return 1;
	      }
	  }	
	  // We also do not want to suggest, for example, Galadriel ally if Galadriel Hero was added to the deck
	  for (var c in deck['1hero']){
	      if (deck['1hero'][c].name_norm==card.name_norm){
	  return 1;
	      }
	  }
	  for (var c in deck['2ally']){
	      if (deck['2ally'][c].name_norm==card.name_norm){
	  return 1;
	      }
	  }
	  return 0;
      };
      // Returns 1 if word is in list
      suggested.isWordInList = function(word,list) {
	  for (var w in list)
	      if(list[w]==word)
	  return 1;
	  return 0;
      };
      // Returns 1 if card is in list
      suggested.isCardInList = function(card,list) {
	  for (var c in list) {
	      if(list[c].cycle==card.cycle && list[c].no==card.no) {
	  return 1;
	      }
	  }
	  return 0;
      };
      // Returns 1 if word is in string
      suggested.isWordInString = function(word,string) {
	  //	  return (string.search(word)>=0);
	  return (string.indexOf(word)>-1);
	  // var hits = string.match(word);
	  // if (hits) return 1;
	  // else return 0;
      };
      // Returns 1 if regexp is in string
      suggested.isRegExpInString = function(regexp,string) {
	  //	  return (string.search(word)>=0);
	  return regexp.exec(string);
	  // var hits = string.match(word);
	  // if (hits) return 1;
	  // else return 0;
      };
      // Takes in a name and expansion, and returns 1 if the card is in the deck (or heroes)
      suggested.isInDeck = function(name_norm,exp) {
	  var deck = suggested.deck;
	  var types = ['1hero','2ally','3attachment','4event','5quest'];
	  for(var t in types)
	      for (var c in deck[types[t]]) {
	  if (deck[types[t]][c].name_norm==name_norm && deck[types[t]][c].exp==exp) return 1;
	      }
	  return 0;	
      };
      // Takes in a word and returns 1 if the word is found in the text/traits of the card
      suggested.isWordInCard = function(word,card) {
	  if (suggested.isWordInString(word,card.text)) return 1;
	  if (suggested.isWordInString(word,card.traits)) return 1;
	  return 0;	
      };
      // Takes in a word and returns 1 if the word is found in the text/traits of a card in the deck
      suggested.isWordInDeck = function(word) {
	  var deck = suggested.deck;
	  var types = ['1hero','2ally','3attachment','4event','5quest'];
	  for(var t in types)
	      for (var c in deck[types[t]])
	  if (suggested.isWordInCard(word,deck[types[t]][c])) return 1;
	  return 0;	
      };
      // Takes in a word and returns 1 if the word is found in the text of a card in the deck
      suggested.isWordInDeckText = function(word) {
	  var deck = suggested.deck;
	  var types = ['1hero','2ally','3attachment','4event','5quest'];
	  for(var t in types)
	      for (var c in deck[types[t]])
	  if (suggested.isWordInString(word,deck[types[t]][c].text)) return 1;
	  return 0;	
      };
      // Takes in a trait and returns 1 if the trait is found in the text of a card in the deck
      suggested.isTraitInDeckText = function(trait) {
	  var deck = suggested.deck;
	  var types = ['1hero','2ally','3attachment','4event','5quest'];
	  for(var t in types)
	      for (var c in deck[types[t]]) {
	  // We do not want to include all Gondor cards just because Steward grants the 'Gondor trait' 
	  if (suggested.isWordInString('trait',deck[types[t]][c].text)) continue;
	  if (suggested.isWordInString(trait,deck[types[t]][c].text)) return 1;
	      }
	  return 0;	
      };
      // Takes in a trait and returns 1 if the trait is found in the traits of a hero in the deck. We also consider keywords like Ranged to be traits.
      suggested.isTraitInHeroTraits = function(trait) {
	  var deck = suggested.deck;
	  for(var h in deck['1hero'])
	      if (suggested.isWordInString(trait,deck['1hero'][h].traits) || suggested.isWordInString(trait,deck['1hero'][h].keywords)) return 1;
	  return 0;	
      };
      // Takes in a trait and returns 1 if the trait is found in the traits of an ally in the deck. We also consider keywords like Ranged to be traits.
      suggested.isTraitInAllyTraits = function(trait) {
	  var deck = suggested.deck;
	  for(var h in deck['2ally'])
	      if (suggested.isWordInString(trait,deck['2ally'][h].traits) || suggested.isWordInString(trait,deck['2ally'][h].keywords)) return 1;
	  return 0;	
      };
      // Takes in a trait and returns 1 if the trait is found in the traits of a character in the deck
      suggested.isTraitInDeckTraits = function(trait) {
	  var deck = suggested.deck;
	  return (suggested.isTraitInHeroTraits(trait)||suggested.isTraitInAllyTraits(trait));
      };

      // Detect monosphere
      suggested.monoSphere = function() {
	  var deck = suggested.deck;
	  if (deck['1hero'].length<3) return '';
	  var sphere = deck['1hero'][0].sphere;
	  for (var h in deck['1hero'])
	      if (deck['1hero'][h].sphere!=sphere) return '';
	  return sphere;
      };

      // Detect monotrait
      suggested.monoTrait = function() {
	  var deck = suggested.deck;
	  if (deck['1hero'].length<3) return '';
	  var traitlist = [];
	  for (var t in suggested['traits']) {
	      var isTraitInAllHeroes = 1;
	      for (var h in deck['1hero'])
	  if (!suggested.isWordInString(suggested['traits'][t],deck['1hero'][h].traits))
	      isTraitInAllHeroes = 0;
	      if (isTraitInAllHeroes) traitlist.push(suggested['traits'][t]);
	  }
	  return traitlist;
      };

      // Detect secrecy
      suggested.isSecrecy = function() {
	  var deck = suggested.deck;
	  if (deck['1hero'].length<3) return 0;
	  return (suggested.startingThreat()<=20);
      };


      suggested.change = function(card,quantity){
          for (var c in suggested[card.type]){
              if (suggested[card.type][c].cycle==card.cycle && suggested[card.type][c].no==card.no){
	  suggested[card.type].splice(c, 1);
              }
	  }
      };
      suggested.quantity = function(card){
	  for(var c in suggested[card.type]){
              if(suggested[card.type][c].cycle==card.cycle && suggested[card.type][c].no==card.no){
	  return suggested[card.type][c].quantity;
              };
	  };
	  return 0;
      };
      suggested.startingThreat = function(){
	  var deck = suggested.deck;
	  var threat = 0;
	  var mirlonde = 0;
	  var loreheroes = 0;
	  for(var h in suggested['1hero']){
              threat += suggested['1hero'][h].cost;
	      if(suggested['1hero'][h].name_norm=="Mirlonde")
	  mirlonde = 1;
	      if(suggested['1hero'][h].sphere=="4lore")
	  loreheroes++;
	  };
	  if(mirlonde) threat-=loreheroes;
	  return threat;
      };
      // Count cards in Deck
      suggested.countDeckAllies = function(){
	  var deck = suggested.deck;
	  var allies=0;
	  for (var a in deck['2ally']) {
              allies += deck['2ally'][a].quantity;
	  };
	  return allies;
      };
      suggested.countDeckAttachments = function(){
	  var deck = suggested.deck;
	  var attachments=0;
	  for (var a in deck['3attachment']) {
              attachments += deck['3attachment'][a].quantity;
	  };
	  return attachments;
      };
      suggested.countDeckEvents = function(){
	  var deck = suggested.deck;
	  var events=0;
	  for (var e in deck['4event']) {
              events += deck['4event'][e].quantity;
	  };
	  return events;
      };
      suggested.countDeckQuests = function(){
	  var deck = suggested.deck;
	  var quests=0;
	  for (var q in deck['5quest']) {
              quests += deck['5quest'][q].quantity;
	  };
	  return quests;
      };
      suggested.countDeckHeroes = function(){
	  var deck = suggested.deck;
	  var heroes=0;
	  for (var h in deck['1hero']) {
              heroes += deck['1hero'][h].quantity;
	  };
	  return heroes;
      };
      // Count cards in suggested
      suggested.countAllies = function(){
      	  var allies=0;
      	  for (var a in suggested['2ally']) {
      	      allies++;
      	  };
      	  return allies;
      };
      suggested.countAttachments = function(){
      	  var attachments=0;
      	  for (var a in suggested['3attachment']) {
      	      attachments++;
      	  };
      	  return attachments;
      };
      suggested.countEvents = function(){
      	  var events=0;
      	  for (var e in suggested['4event']) {
      	      events++;
      	  };
      	  return events;
      };
      suggested.countQuests = function(){
      	  var quests=0;
      	  for (var q in suggested['5quest']) {
      	      quests++;
      	  };
      	  return quests;
      };
      suggested.countHeroes = function(){
      	  var heroes=0;
      	  for (var h in suggested['1hero']) {
      	      heroes++;
      	  };
      	  return heroes;
      };
      
      suggested.countTotal = function() {
	  return suggested.countAllies()+suggested.countAttachments()+suggested.countEvents()+suggested.countQuests();
      };
      
      suggested.empty = function() {
	  return (suggested.countAllies()+suggested.countAttachments()+suggested.countEvents()+suggested.countQuests()+suggested.countHeroes())==0;
      };

      // Remove from suggested
      suggested.remove = function(card) {	
          for (var c in suggested[card.type]){
              if (suggested[card.type][c].cycle==card.cycle && suggested[card.type][c].no==card.no){
	  suggested[card.type].splice(c, 1);
              }
	  }  
	  suggested.blacklist.push(card);
      }
      // Clear the blacklisted cards
      suggested.clearBlacklist = function() {	
	  suggested.blacklist=[];
	  suggested.deckChange(suggested.deck);
      }

      // Show/hide suggested
      suggested.hide = function() {
	  suggested.hidden = 1;
          style.width=0;
          style.minwidth=0;
          style.left='25%';
          style.preview='30%';
          style.right='44%';
      }
      suggested.show = function() {
	  suggested.hidden = 0;
          suggested.deckChange(suggested.deck);
          style.clear();
      }

      
      return suggested;
  }]);

    
    app.controller('suggestedController',['$scope','suggested','image',function($scope,suggested,image){
	$scope.suggested=suggested;
	this.changepreview = function(card){
	    image.update(card);
	}
    }]);
    
    app.directive('suggested', function() {
	return {
	    restrict: 'E',
	    templateUrl: 'suggested.html',
	    controller: 'suggestedController',
	    controllerAs: 'suggestedC'
	};
    });
    
    
    
  app.factory('image',function(){
    var image={};
    image.url="";
    image.name="";
    image.exp="";
    image.text="";
    image.traits="";
    image.flavor="";
    image.loaded=false;
    var cardmarkup = function(text,cardname){
      var rx = new RegExp(cardname, "g");
      text=text.replace(rx,"CARDNAME");
      text=text.replace(/(Orc|Noldor|Archer|Armor|Artifact|Beorning|Boon|Bree|Burglar|Condition|Craftsman|Creature|Dale|Dwarf|D\u00fanedain|Eagle|Ent|Esgaroth|Gondor|Healer|Hobbit|Instrument|Isengard|Istari|Item|Minstrel|Mount|Noble|Noldor|Outlands|Pipe|Ranger|Ring-bearer('s)?|Rohan|Scout|Signal|Silvan|Skill|Song|Spell|Tale|Title|Trait|Trap|Warrior|Weapon|Woodman) /g,
        "<b><i>$1</i></b> ");
      
      
      text=text.replace(/Valour Response:/g,"<b>Valour Response:</b>");
      text=text.replace(/Response:([^<])/g,"<b>Response:</b>$1");
      text=text.replace(/Forced:/g,"<b>Forced:</b>");
      text=text.replace(/When Revealed:/g,"<b>When Revealed:</b>");
      text=text.replace(/Planning Action:/g,"<b>Planning Action:</b>");
      text=text.replace(/Quest Action:/g,"<b>Quest Action:</b>");
      text=text.replace(/Travel Action:/g,"<b>Travel Action:</b>");
      text=text.replace(/Combat Action:/g,"<b>Combat Action:</b>");
      text=text.replace(/Refresh Action:/g,"<b>Refresh Action:</b>");
      text=text.replace(/Valour Action:/g,"<b>Valour Action:</b>");
      text=text.replace(/Action:([^<])/g,"<b>Action:</b>$1");
      text=text.replace(/([^>])Valour/g,"$1<b>Valour</b>");
      
      text=text.replace(/Attack/g,"<img src='img/strength.gif'/>");
      text=text.replace(/Willpower/g,"<img src='img/willpower.gif'/>");
      text=text.replace(/Defense/g,"<img src='img/defense.gif'/>");
      text=text.replace(/Threat/g,"<img src='img/threat.png'/>");
      
      text=text.replace(/Leadership/g,"<img src='img/spheres/1leadership.png'/>");
      text=text.replace(/Tactics/g,"<img src='img/spheres/2tactics.png'/>");
      text=text.replace(/Spirit/g,"<img src='img/spheres/3spirit.png'/>");
      text=text.replace(/Lore/g,"<img src='img/spheres/4lore.png'/>");
      text=text.replace(/Neutral/g,"<img src='img/spheres/5neutral.png'/>");
      text=text.replace(/Baggins/g,"<img src='img/spheres/6baggins.png'/>");
      text=text.replace(/Fellowship/g,"<img src='img/spheres/7fellowship.png'/>");
      
      text=text.replace(/CARDNAME/g,cardname);
      
      return text;
    }
    
    image.update = function(card){
      if(image.url!=card.img){
        image.loaded = false;
        image.url = card.img;
        image.name = card.name;
        image.exp = card.exp;
        image.text = card.keywords + "\n" + card.text;
        image.traits = card.traits;
        image.flavor = (card.flavor||"").replace(/\`/g,'"');
        image.textc = cardmarkup(card.textc,card.name);
        image.cost = card.cost;
        image.willpower = card.willpower;
        image.strength = card.strength;
        image.defense = card.defense;
        image.hitpoints = card.hitpoints;
        image.unique = card.unique;
        image.sphere = "img/spheres/"+card.sphere+".png";
        image.type = card.type.substr(1,1).toUpperCase() + card.type.substr(2);
      }
    }
    image.getUrl = function(){
      return image.url;
    }
    return image;
  });
  
  
  
  app.controller('cardPreview',['$scope','$sce','image','translate',function($scope,$sce,image,translate){
    $scope.trust = $sce.trustAsHtml;
    this.image=image;
    this.getImg = function() {
      return this.image.getUrl();
    };
    this.name = function() {
      return image.name + " (" + translate[image.exp] +")";
    }
    this.alt = function() {
      return image.text;
    }
  }]);
  
  app.directive('cardpreview', function() {
    return {
      restrict: 'E',
      templateUrl: 'cardpreview.html',
      controller: 'cardPreview',
      controllerAs: 'preview'
    };
  });
  
  app.directive('imageonload',function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element.bind('load', function() {
          scope.$apply(function(){
            scope.preview.image.loaded=true;
          });
        });
      }
    };
  });
  
  
  app.controller('myDecks',['deck','suggested','$localStorage','translate','$scope','cardObject','$location',function(deck,suggested,$localStorage,translate,$scope,cardObject,$location){
    if (!$localStorage.decks){
      $localStorage.decks={};
    }
    this.decks = $localStorage.decks;
    this.currentdeck = deck;
    this.deckname="";
    if ($scope.decknotes === undefined)
      $scope.decknotes="";

    this.numberOfDecks = function() {
      return Object.keys(this.decks).length;
    };

    this.saveDeck = function(deckname, decknotes) {
      if (deck.empty()) {
        return alert('Deck is empty!');
      };
      if (this.currentdeck.deckname=="") {
        return alert('Please enter a name!');
      };
      if ($localStorage.decks[deckname]!=null){
        if (confirm('A deck by that name exists, overwrite?')) {
        } else{
          return 0;
        }
      }
      var CompressedDeck=[deckname];
      CompressedDeck.name = deckname;
      var types = ["1hero","2ally","3attachment","4event","5quest"]
      for (var t in types){
        var type = types[t];
        for (var c in deck[type]){
          var card = deck[type][c];
          CompressedDeck.push([card.cycle,card.no,card.quantity]);
        }
      }
      $localStorage.decks[deckname] = {};
      $localStorage.decks[deckname].deck = CompressedDeck;
      $localStorage.decks[deckname].deckname = deckname;
      $localStorage.decks[deckname].decknotes = decknotes;
      $localStorage.decks[deckname].dateUTC = new Date().valueOf().toString();
      
      var compressed = LZString.compressToEncodedURIComponent(JSON.stringify($localStorage.decks[deckname].deck));
      $location.url("/#"+compressed);
    };

    this.loadDeck = function(deckname) {
      var decknotes = "";
      if ($localStorage.decks[deckname].decknotes !== undefined) {
        decknotes = $localStorage.decks[deckname].decknotes;
      }
      deck.load($localStorage.decks[deckname].deck,cardObject,deckname,decknotes);
      $scope.decknotes = decknotes;
      var compressed = LZString.compressToEncodedURIComponent(JSON.stringify($localStorage.decks[deckname].deck));
      $location.url("/#"+compressed);
    };

    $scope.loadDeck = this.loadDeck;

    this.deleteDeck = function(deckname) {
      if (confirm('Are you sure you want to delete this deck?')) {
        delete $localStorage.decks[deckname];
      };
    };

    this.clearDeck = function() {
      //if (deck.empty() || confirm('Are you sure you want to clear this deck?')) {
        deck["1hero"] = [];
        deck["2ally"] = [];
        deck["3attachment"] = [];
        deck["4event"] = [];
        deck["5quest"] = [];
        deck.deckname = "";
	suggested.clearBlacklist();
	suggested.deckChange(deck);
        deck.decknotes = "";
      //};
    };
    
    this.download = function(filename, text) {
      var pom = document.createElement('a');
      pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      pom.setAttribute('download', filename);

      pom.style.display = 'none';
      document.body.appendChild(pom);

      pom.click();

      document.body.removeChild(pom);
    }

    String.prototype.chunk = function(n) {
      var ret = [];
      for(var i=0, len=this.length; i < len; i += n) {
       ret.push(this.substr(i, n))
      }
      return ret
    };
    
    this.plaintext = function(deckArray,deckname,compressed) {
      var deck={};
      deck["1hero"] = [];
      deck["2ally"] = [];
      deck["3attachment"] = [];
      deck["4event"] = [];
      deck["5quest"] = [];
      
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      
      var text="";
      text+=deckname;
      text+="\r\n\r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="\r\n\r\n";
      if (deck["1hero"].length){
        text+="Heroes (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")\r\n"
        for (var i in deck["1hero"]) {
          h = deck["1hero"].sort(function(a,b){return a.name>b.name ? 1 : -1})[i];
          text+="     ";
          text+=h.name;
          text+=" (";
          text+=translate[h.exp];
          text+=")\r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="Allies";
              break;
            case "3attachment":
              text+="Attachments";
              break;
            case "4event":
              text+="Events";
              break;
            case "5quest":
              text+="Quests";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")\r\n"
          var t = deck[type].sort(function(a,b){return (a.sphere==b.sphere) ? ((a.name>b.name)?1:-1) : ((a.sphere>b.sphere)?1:-1) });
          for (var i in deck[type]) {
            text+="  ";
            text+=t[i].quantity;
            text+="x ";
            text+=t[i].name;
            text+=" (";
            text+=translate[t[i].exp];
            text+=")\r\n";
          }
        }
      }
      
      return text;
    }


    this.markdown = function(deckArray,deckname,compressed) {
      var deck={};
      deck["1hero"] = [];
      deck["2ally"] = [];
      deck["3attachment"] = [];
      deck["4event"] = [];
      deck["5quest"] = [];
      
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      
      var text="#[";
      text+=deckname;
      text+="](http://ddddirk.github.io/lotrdb/#/#";
      text+=compressed;
      text+=")  \r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="  \r\n\r\n";
      if (deck["1hero"].length){
        text+="**Heroes** (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")  \r\n"
        for (var i in deck["1hero"]) {
          h = deck["1hero"].sort(function(a,b){return a.name>b.name ? 1 : -1})[i];
          text+="    [";
          text+=h.name;
          text+="](http://hallofbeorn.com/Cards/Details/";
          text+=h.name_norm.replace(/ /g,'-');
          text+='-';
          text+=h.exp;
          text+=") (*";
          text+=translate[h.exp];
          text+="*)  \r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="**Allies**";
              break;
            case "3attachment":
              text+="**Attachments**";
              break;
            case "4event":
              text+="**Events**";
              break;
            case "5quest":
              text+="**Quests**";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")  \r\n"
          var t = deck[type].sort(function(a,b){return (a.sphere==b.sphere) ? ((a.name>b.name)?1:-1) : ((a.sphere>b.sphere)?1:-1) });
          for (var i in deck[type]) {
            text+=" ";
            text+=t[i].quantity;
            text+="x [";
            text+=t[i].name;
            text+="](http://hallofbeorn.com/Cards/Details/";
            text+=t[i].name_norm.replace(/ /g,'-');
            text+='-';
            text+=t[i].exp;
            text+=") (*";
            text+=translate[t[i].exp];
            text+="*)  \r\n";
          }
        }
      }
      
      text+="***\r\n^^Deck ^^built ^^with [^^Rivendell ^^Councilroom](http://ddddirk.github.io/lotrdb)";
      return text;
    }
    
    
    this.bbcode = function(deckArray,deckname,compressed) {
      var deck={};
      deck["1hero"] = [];
      deck["2ally"] = [];
      deck["3attachment"] = [];
      deck["4event"] = [];
      deck["5quest"] = [];
      
      deck.deckname = deckArray[0];
      for (var i=1; i<deckArray.length; i++) {
        for (var j in cardObject) {
          if (deckArray[i][0]==cardObject[j].cycle
          &&  deckArray[i][1]==cardObject[j].no) {
            var card = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            card.quantity = deckArray[i][2];
            deck[card.type].push(card);
          }
        }
      }
      
      var text="[size=18][url=http://ddddirk.github.io/lotrdb/#/#";
      text+=compressed;
      text+="]";
      text+=deckname;
      text+="[/url]";
      text+="[/size]\r\nTotal Cards: ";
      var total = 0;
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var i in deck[type]) {
          total += deck[type][i].quantity;
        }
      }
      text+=total;
      text+="  \r\n\r\n";
      if (deck["1hero"].length){
        text+="[b]Heroes[/b] (starting threat: ";
        var threat=0;
        for (var i in deck["1hero"]) {
          threat += deck["1hero"][i].cost;
        }
        text+=threat;
        text+=")  \r\n"
        for (var i in deck["1hero"]) {
          h = deck["1hero"].sort(function(a,b){return a.name>b.name?1:-1})[i];
          text+="    ";
          text+="[url=http://hallofbeorn.com/Cards/Details/";
          text+=h.name_norm.replace(/ /g,'-').replace(/\'/g,'%27');
          text+='-';
          text+=h.exp;
          text+="]";
          text+=h.name;
          text+="[/url] ([i]";
          text+=translate[h.exp];
          text+="[/i])  \r\n";
        }
      }
      for (var t in types){
        var type = types[t];
        if (deck[type].length){
          switch (type){
            case "2ally":
              text+="[b]Allies[/b]";
              break;
            case "3attachment":
              text+="[b]Attachments[/b]";
              break;
            case "4event":
              text+="[b]Events[/b]";
              break;
            case "5quest":
              text+="[b]Quests[/b]";
              break;
          }
          text+=" (";
          var number=0;
          for (var i in deck[type]) {
            number += deck[type][i].quantity;
          }
          text+=number;
          text+=")  \r\n"
          var t = deck[type].sort(function(a,b){return (a.sphere==b.sphere) ? ((a.name>b.name)?1:-1) : ((a.sphere>b.sphere)?1:-1) });
          for (var i in deck[type]) {
            text+=" ";
            text+=t[i].quantity;
            text+="x ";
            text+="[url=http://hallofbeorn.com/Cards/Details/";
            text+=t[i].name_norm.replace(/ /g,'-').replace(/'/g,'%27');
            text+='-';
            text+=t[i].exp;
            text+="]";
            text+=t[i].name;
            text+="[/url] ([i]";
            text+=translate[t[i].exp];
            text+="[/i])  \r\n";
          }
        }
      }
      
      text+="\r\n[size=7]Deck built with [url=http://ddddirk.github.io/lotrdb]Rivendell Councilroom[/url][/size]";
      return text;
    }
    
    

    
    this.downloadDeck = function(deckname){
      var deck= $localStorage.decks[deckname].deck;
      var notes=$localStorage.decks[deckname].decknotes;
      var CompressedDeck=LZString.compressToEncodedURIComponent(JSON.stringify(deck));
      var text="++++++++++++\r\n+For Reddit+\r\n++++++++++++ \r\n\r\n";
      text+=this.markdown(deck,deckname,CompressedDeck);
      
      text+="\r\n\r\n\r\n\r\n\r\n+++++++++++++++++++ \r\n+For Boardgamegeek+\r\n+++++++++++++++++++  \r\n\r\n";
      text+=this.bbcode(deck,deckname,CompressedDeck);
      
      text+="\r\n\r\n\r\n\r\n\r\n+++++++++++ \r\n+Plaintext+\r\n+++++++++++  \r\n\r\n";
      text+=this.plaintext(deck,deckname,CompressedDeck);
      
      if (notes) {
        text+="\r\n\r\n\r\n\r\n\r\n++++++++++++ \r\n+Deck notes+\r\n++++++++++++  \r\n\r\n";
        text+=notes;
      }

      text+="\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\nDo not remove the part below, you will be unable to upload the deck if you do!\r\n";
      text+="++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++\r\n";
      text+=CompressedDeck.chunk(80).join("\r\n");
      text+="\r\n++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++";


      this.download(deckname+".txt",text);
    };

    this.uploadDeck = function(event) {
      var file = event.target.files[0];
      if (file.name.indexOf(".o8d")>=0) {
        return this.uploadOctgn(file);
      }
      var deckname = file.name.replace('.txt','');
      var deck = this.currentdeck;
      if (file) {
        var r = new FileReader();
          r.onload = function(e) { 
          var contents = e.target.result.replace(/(\r\n|\n|\r)/gm,""); //strip newlines
          var encoded = contents.match(/\+{80}([A-Za-z0-9+\-\r\n]+)\+{80}/gm)[0];
          encoded = encoded.replace(/\+{80}/,"");
          var decoded = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded));
          deck.load(decoded,cardObject);
          $scope.$apply();
        };
        r.readAsText(file);
      };
    };
    
    this.uploadOctgn = function(file){
      var deckname = file.name.replace('.o8d','');
      var deck = this.currentdeck;
      if (file) {
        var r = new FileReader();
          r.onload = function(e) { 
          var deckArray = [deckname];
          var regexp = /<card\s+qty="(\d)"\s+id="([0-9a-f\-]+)">/gi, match;
          while (match = regexp.exec(e.target.result)) {
            for (var i in cardObject) {
              if (cardObject[i].octgn == match[2]) {
                deckArray.push([cardObject[i].cycle,cardObject[i].no,+match[1]]);
              }
            }
          }
          // Element looks like: <notes><![CDATA[Notes go here]]></notes>
          var notesRegexp = /<notes><!\[CDATA\[([\s\S]*?)\]\]><\/notes>/i;
          var notes;
          if (match = e.target.result.match(notesRegexp)) {
            notes = match[1].replace(/]]]]><!\[CDATA\[>/g, "]]>");  // See http://stackoverflow.com/a/223773/2314532
          }



          deck.load(deckArray,cardObject,deckname,notes);
          $scope.decknotes = notes;
          $scope.$apply();
        };
        r.readAsText(file);
      };
    }
    
    
    this.octgn = function(deckname) {
      var deck = {"1hero":[],"2ally":[],"3attachment":[],"4event":[],"5quest":[]};
      var warned = false;
      var notes = $localStorage.decks[deckname].decknotes;
      if (notes === undefined) {
        notes = "";
      }
      for (var c = 1; c < $localStorage.decks[deckname].deck.length; c++) {
        var card = $localStorage.decks[deckname].deck[c];
        for (var j in cardObject) {
          if (card[0]==cardObject[j].cycle
          &&  card[1]==cardObject[j].no) {
            var fullcard = cardObject.slice(+j,+j+1)[0]; //create a copy of the card, not changing the cardObject
            if (fullcard.octgn==""){
              if (!warned){
                window.alert("Warning: Omitting cards that are not yet available in OCTGN.");
                warned = true;
              }
              continue;
            }
            fullcard.quantity = card[2];
            deck[fullcard.type].push(fullcard);
          }
        }
      }
      var text = "";
      text+= '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n';
      text+= '<deck game="a21af4e8-be4b-4cda-a6b6-534f9717391f">\n';
      
      text+= '  <section name="Hero" shared="False">\n';
      for (var h in deck["1hero"]){
        text+='    <card qty="';
        text+=deck["1hero"][h].quantity;
        text+='" id="';
        text+=deck["1hero"][h].octgn;
        text+='">';
        text+=deck["1hero"][h].name_norm;
        text+='</card>\n';
      }
      text+= '  </section>\n';
      
      text+= '  <section name="Ally" shared="False">\n';
      for (var h in deck["2ally"]){
        text+='    <card qty="';
        text+=deck["2ally"][h].quantity;
        text+='" id="';
        text+=deck["2ally"][h].octgn;
        text+='">';
        text+=deck["2ally"][h].name_norm;
        text+='</card>\n';
      }
      text+= '  </section>\n';
      
      text+= '  <section name="Event" shared="False">\n';
      for (var h in deck["4event"]){
        text+='    <card qty="';
        text+=deck["4event"][h].quantity;
        text+='" id="';
        text+=deck["4event"][h].octgn;
        text+='">';
        text+=deck["4event"][h].name_norm;
        text+='</card>\n';
      }
      text+= '  </section>\n';
      
      text+= '  <section name="Attachment" shared="False">\n';
      for (var h in deck["3attachment"]){
        text+='    <card qty="';
        text+=deck["3attachment"][h].quantity;
        text+='" id="';
        text+=deck["3attachment"][h].octgn;
        text+='">';
        text+=deck["3attachment"][h].name_norm;
        text+='</card>\n';
      }
      text+= '  </section>\n';
      
      text+= '  <section name="Side Quest" shared="False">\n';
      for (var h in deck["5quest"]){
        text+='    <card qty="';
        text+=deck["5quest"][h].quantity;
        text+='" id="';
        text+=deck["5quest"][h].octgn;
        text+='">';
        text+=deck["5quest"][h].name_norm;
        text+='</card>\n';
      }
      text+= '  </section>\n';
      
      
      
      text+='  <section name="Quest" shared="True" />\n'
      text+='  <section name="Encounter" shared="True" />\n'
      text+='  <section name="Special" shared="True" />\n'
      text+='  <section name="Setup" shared="True" />\n'


      text+='  <notes><![CDATA[';
      text+=notes.replace(/]]>/g, "]]]]><![CDATA[>");  // See http://stackoverflow.com/a/223773/2314532
      text+=']]></notes>';
      text+='</deck>';
      
      this.download(deckname+".o8d",text);
    }
    
    
  }]);
  
  
  
  app.directive('mydecks', function() {
    return {
      restrict: 'E',
      templateUrl: 'mydecks.html',
      controller: 'myDecks',
      controllerAs: 'mydecks'
    };
  });
  
  
  
  app.directive('stats', function() {
    return {
      restrict: 'E',
      templateUrl: 'stats.html',
      controller: 'stats',
      controllerAs: 'stats'
    };
  });
  
  app.controller('stats',['deck',function(deck){
    this.sphereCanvas = document.getElementById("spheres").getContext("2d");
    this.costCanvas = document.getElementById("cost").getContext("2d");
    this.typeCanvas = document.getElementById("type").getContext("2d");
    
    this.filter = {sphere:null, cost:null, type:null};
    
    this.reloadDeck = function() {
      this.cards = [];
      var types = ["2ally","3attachment","4event","5quest"]
      for (var t in types) {
        var type = types[t];
        for (var c in deck[type]) {
          var card = deck[type][c];
          for (var i = 0; i<card.quantity; i++){
            this.cards.push(card);
          }
        }
      }
      
    }
    
    this.reshuffle = function() {
      this.reloadDeck();
      function shuffle(o){ //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
      };
      shuffle(this.cards);
      this.hand = this.cards.slice(0,6);
      this.deck = this.cards.slice(6).reverse();
    };
    
    this.draw = function() {
      this.hand.push(this.deck.pop());
    }

    this.playCard = function(handIndex) {
      this.hand.splice(handIndex, 1);
    }
    
    this.sphereSplit = function() {
      this.reloadDeck();
      var colors = ["purple","red","blue","green","grey","yellow","orange","lightgrey"];
      var split = [ {label:"Leadership", value: 0, color: colors[0]},
                    {label:"Tactics", value: 0, color: colors[1]},
                    {label:"Spirit", value: 0, color: colors[2]},
                    {label:"Lore", value: 0, color: colors[3]},
                    {label:"Neutral", value: 0, color: colors[4]},
                    {label:"Baggins", value: 0, color: colors[5]},
                    {label:"Fellowship", value: 0, color: colors[6]}];
      for (var c in this.cards) {
        if  ((this.filter.type==null || this.filter.type==this.cards[c].type)
          && (this.filter.cost==null || this.filter.cost==this.cards[c].cost)) {
          switch (this.cards[c].sphere) {
            case "1leadership":
              split[0].value++;
              break;
            case "2tactics":
              split[1].value++;
              break;
            case "3spirit":
              split[2].value++;
              break;
            case "4lore":
              split[3].value++;
              break;
            case "5neutral":
              split[4].value++;
              break;
            case "6baggins":
              split[5].value++;
              break;
            case "7fellowship":
              split[6].value++;
              break;
          }
        };
      }
      if (this.sphereChart) {
        this.sphereChart.destroy();
      }
      
      this.sphereChart = new Chart(this.sphereCanvas).Pie(split);
      parent = this;
      this.sphereCanvas.canvas.onclick = function(evt){
        var sphere = parent.sphereChart.getSegmentsAtEvent(evt)[0].label;
        if (sphere){
          
          parent.filter.type=null;
          parent.filter.cost=null;
          parent.sphereSplit();
          parent.sphereFilter(sphere,colors);
          parent.costSplit();
          parent.typeSplit();
        }
      };
    }
    
    this.costSplit = function() {
      this.reloadDeck();
      var split = {labels: ['0','1','2','3','4','5','6','X'],
                  datasets:[{label:"Cost",data:[0,0,0,0,0,0,0,0]}]};
      for (var c in this.cards) {
        if  ((this.filter.sphere==null || this.filter.sphere==this.cards[c].sphere)
          && (this.filter.type==null || this.filter.type==this.cards[c].type)) {
          var cost = this.cards[c].cost;
          console.log(cost);
          if (cost=="X"){
            split.datasets[0].data[7]++;
          } else{
            split.datasets[0].data[cost]++;
          }
        }
      }
      if (this.costChart) {
        this.costChart.destroy();
      }
      this.costChart = new Chart(this.costCanvas).Bar(split);
    }
    
    
    
    this.typeSplit = function() {
      this.reloadDeck();
      var colors = ["red","green","blue","yellow","lightgrey"];
      var split = [ {label:"Ally", value: 0, color: colors[0]},
                    {label:"Attachment", value: 0, color: colors[1]},
                    {label:"Event", value: 0, color: colors[2]},
                    {label:"Side Quest", value: 0, color: colors[3]}];
      for (var c in this.cards) {
        if  ((this.filter.sphere==null || this.filter.sphere==this.cards[c].sphere)
          && (this.filter.cost==null || this.filter.cost==this.cards[c].cost)) {
          switch (this.cards[c].type) {
            case "2ally":
              split[0].value++;
              break;
            case "3attachment":
              split[1].value++;
              break;
            case "4event":
              split[2].value++;
              break;
            case "5quest":
              split[3].value++;
              break;
          }
        }
      }
      if (this.typeChart) {
        this.typeChart.destroy();
      }
      this.typeChart = new Chart(this.typeCanvas).Pie(split);
      
      parent = this;
      this.typeCanvas.canvas.onclick = function(evt){
        var type = parent.typeChart.getSegmentsAtEvent(evt)[0].label;
        if (type){
          
          parent.filter.sphere=null;
          parent.filter.cost=null;
          parent.typeSplit();
          parent.typeFilter(type,colors);
          parent.sphereSplit();
          parent.costSplit();
        }
      };
    }
    
    
    this.refresh = function() {
      this.filter = {sphere:null, cost:null, type:null};
      this.sphereSplit();
      this.costSplit();
      this.typeSplit();
    }
    
    
    
    this.sphereFilter = function(_sphere,colors) {
      var sphere=null;
      var i;
      switch (_sphere) {
        case "Leadership":
          sphere = "1leadership";
          i=0;
          break;
        case "Tactics":
          sphere = "2tactics";
          i=1;
          break;
        case "Spirit":
          sphere = "3spirit";
          i=2;
          break;
        case "Lore":
          sphere = "4lore";
          i=3;
          break;
        case "Neutral":
          sphere = "5neutral";
          i=4;
          break;
        case "Baggins":
          sphere = "6baggins";
          i=5;
          break;
        case "Fellowship":
          sphere = "7fellowship";
          i=6;
          break;
      }
      if ((this.filter.sphere == sphere) || (sphere==null)) {
        this.filter.sphere = null;
        this.sphereChart.segments[0].fillColor = colors[0];
        this.sphereChart.segments[1].fillColor = colors[1];
        this.sphereChart.segments[2].fillColor = colors[2];
        this.sphereChart.segments[3].fillColor = colors[3];
        this.sphereChart.segments[4].fillColor = colors[4];
        this.sphereChart.segments[5].fillColor = colors[5];
        this.sphereChart.segments[6].fillColor = colors[6];
        this.sphereChart.segments[0]._saved.fillColor = colors[0];
        this.sphereChart.segments[1]._saved.fillColor = colors[1];
        this.sphereChart.segments[2]._saved.fillColor = colors[2];
        this.sphereChart.segments[3]._saved.fillColor = colors[3];
        this.sphereChart.segments[4]._saved.fillColor = colors[4];
        this.sphereChart.segments[5]._saved.fillColor = colors[5];
        this.sphereChart.segments[6]._saved.fillColor = colors[6];
      } else {
        this.filter.sphere = sphere;
        this.sphereChart.segments[0].fillColor = colors[7];
        this.sphereChart.segments[1].fillColor = colors[7];
        this.sphereChart.segments[2].fillColor = colors[7];
        this.sphereChart.segments[3].fillColor = colors[7];
        this.sphereChart.segments[4].fillColor = colors[7];
        this.sphereChart.segments[5].fillColor = colors[7];
        this.sphereChart.segments[6].fillColor = colors[7];
        this.sphereChart.segments[i].fillColor = colors[i];
        this.sphereChart.segments[0]._saved.fillColor = colors[7];
        this.sphereChart.segments[1]._saved.fillColor = colors[7];
        this.sphereChart.segments[2]._saved.fillColor = colors[7];
        this.sphereChart.segments[3]._saved.fillColor = colors[7];
        this.sphereChart.segments[4]._saved.fillColor = colors[7];
        this.sphereChart.segments[5]._saved.fillColor = colors[7];
        this.sphereChart.segments[6]._saved.fillColor = colors[7];
        this.sphereChart.segments[i]._saved.fillColor = colors[i];
      }
      
      return(this.sphereChart.update());
    }
    
    
    this.typeFilter = function(_type,colors) {
      var type=null;
      var i;
      switch (_type) {
        case "Ally":
          type = "2ally";
          i=0;
          break;
        case "Attachment":
          type = "3attachment";
          i=1;
          break;
        case "Event":
          type = "4event";
          i=2;
          break;
        case "Side Quest":
          type = "5quest";
          i=3;
          break;
      }
      if ((this.filter.type == type) || (type==null)) {
        this.filter.type = null;
        this.typeChart.segments[0].fillColor = colors[0];
        this.typeChart.segments[1].fillColor = colors[1];
        this.typeChart.segments[2].fillColor = colors[2];
        this.typeChart.segments[3].fillColor = colors[3];
        this.typeChart.segments[0]._saved.fillColor = colors[0];
        this.typeChart.segments[1]._saved.fillColor = colors[1];
        this.typeChart.segments[2]._saved.fillColor = colors[2];
        this.typeChart.segments[3]._saved.fillColor = colors[3];
      } else {
        this.filter.type = type;
        this.typeChart.segments[0].fillColor = colors[4];
        this.typeChart.segments[1].fillColor = colors[4];
        this.typeChart.segments[2].fillColor = colors[4];
        this.typeChart.segments[3].fillColor = colors[4];
        this.typeChart.segments[i].fillColor = colors[i];
        this.typeChart.segments[0]._saved.fillColor = colors[4];
        this.typeChart.segments[1]._saved.fillColor = colors[4];
        this.typeChart.segments[2]._saved.fillColor = colors[4];
        this.typeChart.segments[3]._saved.fillColor = colors[4];
        this.typeChart.segments[i]._saved.fillColor = colors[i];
      }
      
      return(this.typeChart.update());
    }
    
  }]);
  
  
  
  
  
  
  
  
  
  app.factory('translate',function(){
    var translate={};
    translate[""]="";
    translate.core="Core Set";
    translate.kd=unescape("Khazad-D%FBm");
    translate.hon=unescape("Heirs of N%FAmenor");
    translate.voi="The Voice of Isengard";
    translate.tlr="The Lost Realm";
    translate.thohauh="Over Hill and Under Hill";
    translate.thfg="The Hunt for Gollum";
    translate.trg="The Redhorn Gate";
    translate.tsf="The Steward's Fear";
    translate.tdt="The Dunland Trap";
    translate.twoe="The Wastes of Eriador";
    translate.thotd="On the Doorstep";
    translate.catc="Conflict at the Carrock";
    translate.rtr="Road to Rivendell";
    translate.tdf=unescape("The Dr%FAadan Forest");
    translate.ttt="The Three Trials";
    translate.efmg="Escape from Mount Gram";
    translate.tbr="The Black Riders";
    translate.ajtr="A Journey to Rhosgobel";
    translate.twitw="The Watcher in the Water";
    translate.eaad=unescape("Encounter at Amon D%EEn");
    translate.tit="Trouble in Tharbad";
    translate.rd="The Road Darkens";
    translate.thoem="The Hills of Emyn Muil";
    translate.tld="The Long Dark";
    translate.aoo="Assault on Osgiliath";
    translate.nie="The Nin-in-Eilph";
    translate.tdm="The Dead Marshes";
    translate.fos="Foundations of Stone";
    translate.tbog="The Blood of Gondor";
    translate.cs="Celebrimbor's Secret";
    translate.rtm="Return to Mirkwood";
    translate.saf="Shadow and Flame";
    translate.tmv="The Morgul Vale";
    translate.tac="The Antlered Crown";
    translate.tos="The Treason of Saruman";
    translate.tlos="The Land of Shadow";
    translate.ate="Across the Ettenmoors";
    translate.ttor="The Treachery of Rhudaur";
    translate.tbocd=unescape("The Battle of Carn D%FBm");
    translate.tdr="The Dread Realm";
    translate.tgh="The Grey Havens";
    return translate;
  });
  

})();
