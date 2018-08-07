// game map
// 2 is for room
// 1 is for tunnel

var canvas = document.getElementById('canvas');
var numRoomWide = 40;
var numRoomsLong = 40;
var roomSizeMin = 2;
var roomSizeMax = 5;

var numrooms = 40;
var roomSize = 10;

var colorSwatch = ['rgb(140,229,95)', 'rgb(65,105,225)', 'rgb(0,0,220)', 'rgb(255,0,63)', 'rgb(255,242,91)'];
var other = ['rgb(165,190,0)', 'rgb(184,242,230)', 'rgb(255,166,158)', 'rgb(255,147,79)'];
var black = 'rgb(0,0,0)';
var white = 'rgb(255, 255, 255)';
var step = 0;
var sleepTime = 1000;

function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Room(point, width, length) {
  this.location = point;
  this.width = width;
  this.length = length;
  this.color = white;

  this.toString = function() {
    console.log("x: ", this.location.x);
    console.log("y: ", this.location.y);
    console.log("width: ", this.width);
    console.log("length: ", this.length);
    console.log("color: ", this.color);
    console.log("\n\n");
  };

  this.overlapsOtherRoom = function(otherRoom) {
    var ax1 = this.location.x;
    var ay1 = this.location.y;
    var ax2 = this.location.x + this.width;
    var ay2 = this.location.y + this.length;

    var bx1 = otherRoom.location.x;
    var by1 = otherRoom.location.y;
    var bx2 = otherRoom.location.x + otherRoom.width;
    var by2 = otherRoom.location.y + otherRoom.length;

    return ax1 <= bx2 && ax2 >= bx1 && ay1 <= by2 && ay2 >= by1;
  };
}

function Map(width, length, roomSizeMin, roomSizeMax) {
  this.width = width;
  this.length = length;
  this.listOfRooms = [];

  this.roomSizeMin = roomSizeMin;
  this.roomSizeMax = roomSizeMax;
  this.mapSpace = new Array(length);

  for (var i = 0; i < length; i++) {
    this.mapSpace[i] = new Array(width);
    for (var j = 0; j < width; j++) {
      this.mapSpace[i][j] = 0;
    }
  }

  this.addRoom = function(room) {
    this.listOfRooms.push(room);

    for (var row = room.location.y; row < (room.location.y + room.length); row++) {
      for (var col = room.location.x; col < (room.location.x + room.width); col++) {
        this.mapSpace[row][col] = 2;
      }
    }
  };

  this.createRandomlySizedRoom = function() {
    var randomWidth = randomNum(this.roomSizeMin, this.roomSizeMax);
    var randomLength = randomNum(this.roomSizeMin, this.roomSizeMax);

    var randomColor = Math.ceil(Math.random() * colorSwatch.length) - 1;

    var xPosition = randomNum(0, this.width - randomWidth);
    var yPosition = randomNum(0, this.length - randomLength);

    var location = new Point(xPosition, yPosition);

    var newRoom = new Room(location, randomWidth, randomLength);
    newRoom.color = colorSwatch[randomColor];
    return newRoom;
  };

  this.checkIfRoomOverlaps = function(room) {
    for (var i = 0; i < this.listOfRooms.length; i++) {
      if (room.overlapsOtherRoom(this.listOfRooms[i])) {
        return true;
      }
    }

    return false;
  };
}


function randomNum(lowerBound, upperBound) {
    var randNum = Math.random() * (upperBound - lowerBound + 1);
    return Math.floor(randNum + lowerBound);
}


function drawRoom(room) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = room.color;
  ctx.fillRect(room.location.x * roomSize, room.location.y * roomSize, room.width * roomSize, room.length * roomSize);
};


// this creates a map of all unused blocks in the game (aka solid space)
function findUnvisitedCells(gameMap) {
  var roomToDraw = new Room(new Point(0,0), 1, 1);

  for (var i = 0; i < gameMap.width; i++) {
    for (var j = 0; j < gameMap.length; j++) {
      roomToDraw.location.x = i;
      roomToDraw.location.y = j;
      if (gameMap.mapSpace[j][i] == 2) {
        roomToDraw.color = white;
      }
      else if (gameMap.mapSpace[j][i] != 0){
        roomToDraw.color = 'rgb(200,0,0)';
      }
      else {
          continue;
      }

      drawRoom(roomToDraw);
    }
  }
}


async function createRandomMaze(gameMap) {
  var startLocation = findStartPoint(gameMap);
  var stackOfRoomsToCheck = [];
  stackOfRoomsToCheck.push(startLocation);

  while (startLocation != null) {
    await createRoute(gameMap, stackOfRoomsToCheck);
    startLocation = findStartPoint(gameMap);
    stackOfRoomsToCheck.push(startLocation);
    await sleep(sleepTime);
  }

  console.log("motha fucken done with this part!!")
}

async function createRoute(gameMap, stackOfRoomsToCheck) {
  var location;
  var locationsToCheck;

  while(stackOfRoomsToCheck.length > 0) {
      location = stackOfRoomsToCheck.pop();
      if (findNeigboringBlocks(gameMap, location) > 2) {
        drawBlock(location, colorSwatch[3]);
        continue;
      }
      gameMap.mapSpace[location.y][location.x] = 1;

      locationsToCheck = returnDirectionsToTravelForStack(gameMap, location);
      locationsToCheck.forEach(function check(loc) {
        drawBlock(loc, colorSwatch[1]);
      });
      drawBlock(location, colorSwatch[0]);

      stackOfRoomsToCheck = stackOfRoomsToCheck.concat(locationsToCheck);

      await sleep(sleepTime);
  }

  return gameMap;
}


function returnDirectionsToTravelForStack(gameMap, location) {
  // 0 top
  // 1 right
  // 2 down
  // 3 left
  var locationsToAdd = [];
  var directionToLookFirst = Math.floor(Math.random() * 4);
  var locationToCheck, neighboringBlocks;

  for (var i = 0; i < 4; i++) {
    locationToCheck = returnNewLocation(directionToLookFirst, location);
    directionToLookFirst = (directionToLookFirst + 1) % 4;

    neighboringBlocks = findNeigboringBlocks(gameMap, locationToCheck);
    if (neighboringBlocks <= 2 && neighboringBlocks > 0) {
      locationsToAdd.push(locationToCheck);
    }
  }

  return locationsToAdd;
}


function returnNewLocation(direction, location) {

  switch (direction) {
    case 0:
      return new Point(location.x, location.y - 1);
    case 1:
      return new Point(location.x + 1, location.y);
    case 2:
      return new Point(location.x, location.y + 1);
    case 3:
      return new Point(location.x - 1, location.y);
    default:
      console.log("not a valid direction");
  }
}


// this will return an integer of the number of surrounding blocks
function findNeigboringBlocks(gameMap, location) {
  var neighboringBlocks = 0;

  if (gameMap.mapSpace[location.y][location.x] == 1) {
    return 8;
  }

  for (var x = location.x - 1; x <= location.x + 1; x++) {
    for (var y = location.y - 1; y <= location.y + 1; y++) {

      if (location.x == x && location.y == y) {
        continue;
      }

      if (x < 0 || x > gameMap.width - 1) {
        neighboringBlocks++;
        continue;
      }

      if (y < 0 || y > gameMap.length - 1) {
        neighboringBlocks++;
        continue;
      }

      // we dont want our tunnels getting near the corners of rooms
      neighboringBlocks += gameMap.mapSpace[y][x];
    }
  }

  return neighboringBlocks;
}


function findStartPoint(gameMap) {
  var location = new Point(0, 0);

  for (var x = 1; x < gameMap.width - 1; x++) {
    for (var y = 1; y < gameMap.length - 1; y++) {
      location.x = x;
      location.y = y;

      if (findNeigboringBlocks(gameMap, location) == 0) {
        console.log("start location");
        console.log("x: " + location.x);
        console.log("y: " + location.y);

        return location;
      }
    }
  }

  return null;
}

async function connectRooms(gameMap) {

  for (var room of gameMap.listOfRooms) {
      // 4 sides so 4 possible opening per room
      var numberOfOpenings = Math.floor(Math.random() * 4);
      var listOfOpeningToUse = []
      var listOfOpeningChoices = [];
      var openingToUse = 0;
      var xToStart = 0;
      var yToStart = 0;

      numberOfOpenings = numberOfOpenings == 0 ? 1 : numberOfOpenings;

      // top side
      xToStart = room.location.x;
      yToStart = room.location.y - 2;

      for (var x = xToStart; x < xToStart + room.width; x++) {
        if (yToStart <= 0) {
          break;
        }

        // if a tunnel is found add to the choices
        if (gameMap.mapSpace[yToStart][x] == 1) {
          listOfOpeningChoices.push(new Point(x, yToStart + 1));
        }
      }

      if (listOfOpeningChoices.length > 0) {
        openingToUse = Math.floor(Math.random() * listOfOpeningChoices.length);
        listOfOpeningToUse.push(listOfOpeningChoices[openingToUse]);
      }

      listOfOpeningChoices = [];


      // left side
      xToStart = room.location.x - 2;
      yToStart = room.location.y ;
      for (var y = yToStart; y < yToStart + room.length; y++) {
        if (xToStart <= 0) {
          break;
        }

        // if a tunnel is found add to the choices
        if (gameMap.mapSpace[y][xToStart] == 1) {
          listOfOpeningChoices.push(new Point(xToStart + 1, y));
        }
      }

      if (listOfOpeningChoices.length > 0) {
        openingToUse = Math.floor(Math.random() * listOfOpeningChoices.length);
        listOfOpeningToUse.push(listOfOpeningChoices[openingToUse]);
      }

      listOfOpeningChoices = [];


      // bottom side
      xToStart = room.location.x;
      yToStart = room.location.y + room.length + 1;
      for (var x = xToStart; x < xToStart + room.width; x++) {
        if (yToStart >= gameMap.length - 1) {
          break;
        }

        // if a tunnel is found add to the choices
        if (gameMap.mapSpace[yToStart][x] == 1) {
          listOfOpeningChoices.push(new Point(x, yToStart - 1));
        }
      }

      if (listOfOpeningChoices.length > 0) {
        openingToUse = Math.floor(Math.random() * listOfOpeningChoices.length);
        listOfOpeningToUse.push(listOfOpeningChoices[openingToUse]);
      }

      listOfOpeningChoices = [];


      // right side
      xToStart = room.location.x + room.width + 1;
      yToStart = room.location.y;
      for (var y = yToStart; y < yToStart + room.length; y++) {
        if (xToStart >= gameMap.width - 1) {
          break;
        }
        // if a tunnel is found add to the choices
        if (gameMap.mapSpace[y][xToStart] == 1) {
          listOfOpeningChoices.push(new Point(xToStart - 1, y));
        }
      }

      if (listOfOpeningChoices.length > 0) {
        openingToUse = Math.floor(Math.random() * listOfOpeningChoices.length);
        listOfOpeningToUse.push(listOfOpeningChoices[openingToUse]);
      }

      listOfOpeningChoices = [];

      // shuffle openings
      listOfOpeningToUse = shuffle(listOfOpeningToUse);
      for (var i = 0; i < Math.min(numberOfOpenings, listOfOpeningToUse.length); i++) {
        console.log(listOfOpeningToUse);
        var x = listOfOpeningToUse[i].x;
        var y = listOfOpeningToUse[i].y;
        gameMap.mapSpace[y][x] = 1;
        drawBlock(listOfOpeningToUse[i], white);
        await sleep(sleepTime);
      }
  }
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


async function createRooms(numRooms, gameMap) {
  // create rooms
  for (var i = 0; i < numrooms; i++) {
    var randomRoom = gameMap.createRandomlySizedRoom();

    // only create room it creates no overlap with another room
    if(!gameMap.checkIfRoomOverlaps(randomRoom)) {
      this.gameMap.addRoom(randomRoom);
      drawRoom(randomRoom);
      await sleep(sleepTime);
    }
  }
}


function drawBlock(point, color) {
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(point.x * roomSize, point.y * roomSize, roomSize, roomSize);
}


function continueProcess() {
  switch(step) {
    case 0:
      createRooms(numrooms, gameMap);
      step++;
      break;

    case 1:
      findUnvisitedCells(gameMap);
      step++;
      break;

    case 2:
      createRandomMaze(gameMap);
      step++;
      break;

    case 3:
      connectRooms(gameMap);
      step++;
      break;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// MAIN ///
var gameMap;

function getInputValues() {
  numRoomWide = parseInt(document.getElementById("wide").value);
  numRoomsLong = parseInt(document.getElementById("long").value);
  roomSizeMin = parseInt(document.getElementById("min").value);
  roomSizeMax = parseInt(document.getElementById("max").value);
  sleepTime = parseInt(document.getElementById("speed").value);
}

function start() {
  step = 0;
  getInputValues();

  gameMap = new Map(numRoomWide, numRoomsLong, roomSizeMin, roomSizeMax);
  var gameSpace = new Room(new Point(0,0), numRoomWide, numRoomsLong);
  gameSpace.color = black;
  drawRoom(gameSpace);
}

var slider = document.getElementById("speed");
var output = document.getElementById("speedValue");
output.innerHTML = slider.value + "ms";

slider.oninput = function() {
  output.innerHTML = slider.value + "ms";
  sleepTime = this.value;
}
