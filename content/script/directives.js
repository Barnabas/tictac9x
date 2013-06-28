(function (angular) {
	var mod = angular.module("app.directives", []);

	var templateRoot = "content/templates/";

	mod.directive("gameGrid", function () {
		return {
			restrict    : "A",
			replace     : true,
			templateUrl : templateRoot + "gameGrid.html",
			scope       : {gridState : "="},        // need local scope because scope vars definitely collide
			controller  : ["$scope", "$attrs", function ($scope, $attrs) {
				var gridId = $attrs["gameGrid"];
				$scope.isEnabled = true;

				$scope.$on("selectGridCell", function (evt, cellId) {
					$scope.$emit("submitMove", {
						gridId : gridId,
						cellId : cellId
					});
				});

				// watching parents may be cheating but it beats passing all this crap in
				$scope.$parent.$watch("game.activeGrid", function (id) {
					if (id != undefined) $scope.isEnabled = (id == gridId || id === false);
				});
				$scope.$parent.$watch("game.mainGrid", function (state) {
					if (state && state[gridId]) $scope.gridWinner = state[gridId];
				}, true);
			}]
		};
	});

	mod.directive("gridCell", function () {
		return {
			restrict : "A",
			replace  : true,
			template : "<div class='grid-cell' unselectable='on' ng-class='{available: !cellState, isX: cellState == \"X\", isO: cellState == \"O\"}'>{{cellState || '&nbsp;'}}</div>",
			scope    : {cellState : "="},
			link     : function (scope, element, attr) {
				element.bind("click", function () {
					scope.$emit("selectGridCell", attr["gridCell"]);
				});
			}
		};
	});

})(angular);
