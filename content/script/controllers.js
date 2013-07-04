function HomeCtrl($scope, $state, firebaseUrl, storedIdSvc) {

	var gamesRef = new Firebase(firebaseUrl + "games");
	var playerId = storedIdSvc.getId("player");

	$scope.playerId = playerId;
	$scope.startGame = function () {
		var newGame = {
			activeGrid : false,
			winner     : false,
			X          : playerId,  // player who starts the game will be X
			O          : false,     // 0 not set yet until they join
			message    : "Waiting for O to join"
		};
		var newGameRef = gamesRef.push(newGame);
		$state.transitionTo("game", {gameId : newGameRef.name()});
	}
}

HomeCtrl.$inject = ["$scope", "$state", "firebaseUrl", "storedIdSvc"];


function GameCtrl($scope, $stateParams, $timeout, firebaseUrl, storedIdSvc, angularFire) {

	var playerId = storedIdSvc.getId("player");
	$scope.game = {currentPlayer : "nobody"};
	$scope.player = "?";
	$scope.isConnected = false;

	// prepare the game and join
	angularFire(firebaseUrl + "games/" + $stateParams.gameId, $scope, "game", {}).then(function () {
		// decide if I'm X or O, maybe I'm nobody
		if (!$scope.game.mainGrid) $scope.game.mainGrid = {};
		if (!$scope.game.subGrids) $scope.game.subGrids = {};

		if ($scope.game.X == playerId) {
			$scope.player = "X";    // I'm X
		} else if ($scope.game.O == playerId) {
			$scope.player = "O";    // I'm O
		} else if ($scope.game.O == false) {

			$scope.player = "O";    // I'll be O and we can get started

			// update game with timeout, otherwise it doesn't get sent
			$timeout(function(){
				$scope.game.O = playerId;
				$scope.game.message = "O has joined the game";
				$scope.game.currentPlayer = "O";
			}, 200);
		}

		// make game URL visible
		$scope.gameUrl = window.location + "";
	});

	// connectivity variable
	angularFire(firebaseUrl + ".info/connected", $scope, "isConnected", true);


	// game logic is all here
	$scope.$on("submitMove", function (evt, data) {
		// determine if it's a valid move

		if ($scope.game.winner || $scope.player != $scope.game.currentPlayer) return;  // not my turn
		if (data.gridId != $scope.game.activeGrid && $scope.game.activeGrid !== false) return; // not a valid grid

		if($scope.game.subGrids == undefined) $scope.game.subGrids = {};
		var grid = $scope.game.subGrids[data.gridId];
		if (grid == undefined)  grid = $scope.game.subGrids[data.gridId] = {};  // create grid if no move yet

		if (grid[data.cellId]) return;      // already played, do nothing
		grid[data.cellId] = $scope.player;  // claim the cell

		// check for wins
		var mainGrid = $scope.game.mainGrid;
		if (mainGrid == undefined) mainGrid = $scope.game.mainGrid = {}; // create main grid if undefined
		if (!mainGrid[data.gridId]) {
			if (isWinner($scope.player, grid)) {
				mainGrid[data.gridId] = $scope.player;
				if (isWinner($scope.player, mainGrid)) {
					// game over
					$scope.game.message = "Game over! " + $scope.player + " captured the " + data.gridId + " grid and won";
					$scope.game.winner = $scope.player;
					$scope.game.activeGrid = "none";
				} else {
					$scope.game.message = $scope.player + " captured the " + data.gridId + " grid";
				}
			} else {
				$scope.game.message = $scope.player + " played the " + data.cellId + " cell of the " + data.gridId + " grid";
			}
		}

		// change current player and active grid
		$scope.game.currentPlayer = ($scope.player == "X") ? "O" : "X";

		// special case: if the next active grid is totally full, then opponent can go anywhere
		var nextGrid = $scope.game.subGrids[data.cellId];
		$scope.game.activeGrid = propertyCount(nextGrid) >= 9 ? false : data.cellId;
		$scope.$apply();
	});

	// determine if the grid is won
	function isWinner(player, grid) {
		var matrix = [
			[grid.top_left == player, grid.top_center == player, grid.top_right == player],
			[grid.middle_left == player, grid.middle_center == player, grid.middle_right == player],
			[grid.bottom_left == player, grid.bottom_center == player, grid.bottom_right == player]
		];

		// check diagonal win
		if (matrix[1][1]) {
			if (matrix[0][0] && matrix[2][2]) return true;
			if (matrix[0][2] && matrix[2][0]) return true;
		}

		// rows and columns
		for (var i = 0; i < 3; i++) {
			if (matrix[i][0] && matrix[i][1] && matrix[i][2]) return true;
			if (matrix[0][i] && matrix[1][i] && matrix[2][i]) return true;
		}

		return false;
	}

	// count the number of keys in an object
	function propertyCount(obj) {
		if (obj == null || typeof obj !== "object") return 0;
		var count = 0;
		for (var k in obj) if (obj.hasOwnProperty(k)) count++;
		return count;
	}

}
GameCtrl.$inject = ["$scope", "$stateParams", "$timeout", "firebaseUrl", "storedIdSvc", "angularFire"];