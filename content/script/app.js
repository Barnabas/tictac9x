(function (angular) {
	var mod = angular.module("app", ["app.directives", "ui.state", "firebase"]);

	function modConfig($provide, $stateProvider, $urlRouterProvider) {
		var pageRoot = "content/pages/";


		if(window.config) {
			$provide.value("firebaseUrl", window.config.firebaseUrl);     // set in config.js

			$stateProvider.state("home", {
				url         : "/",
				templateUrl : pageRoot + "home.html",
				controller  : HomeCtrl
			});
			$stateProvider.state("game", {
				url         : "/game{gameId}",
				templateUrl : pageRoot + "game.html",
				controller  : GameCtrl
			});


		} else {
			$stateProvider.state("home", {
				url         : "/",
				templateUrl : pageRoot + "setup.html"
			});
		}
		$urlRouterProvider.otherwise("/");
	}

	function modRun($location, $rootScope) {
		$rootScope.setTitle = function (title) {
			$rootScope.pageTitle = title;
		};
	}

	mod.config(["$provide", "$stateProvider", "$urlRouterProvider", modConfig]);

	mod.run(["$location", "$rootScope", modRun]);

	mod.filter("spacify", function(){
		return function(input){
			return (input + "").replace(/_/g, " ");
		}
	})

	// create a persistent ID in local storage
	mod.factory("storedIdSvc", function () {

		function createId() {
			var guidMin = parseInt("1000000000", 36);
			var guidMax = parseInt("zzzzzzzzzz", 36);
			return (Math.floor(Math.random() * (guidMax - guidMin)) + guidMin).toString(36);
		}

		return {
			getId: function(idType, forceCreate) {
				var id = null;
				var storageKey = "sid_" + (idType || "session");
				if(window.localStorage) {
					id = localStorage.getItem(storageKey);
					if(id == null || forceCreate === true) {
						id = createId();
						localStorage.setItem(storageKey, id);
					}
				} else {
					id = createId();    // fallback for stupid browsers
				}
				return id;
			}
		}
	});

})(angular);
