//META{"name":"Premium","version":"0.1.0","source":"https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Premium/Premium.plugin.js","updateUrl":"https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Premium/Premium.plugin.js","website":"https://raw.githubusercontent.com/pipipear/BD/"}*//


class Premium {
	/* BD stuff */
	getName        = () => "Premium";
	getVersion     = () => "0.1.0";
	getAuthor      = () => "pi";
	getDescription = () => "become epic hacker and listen along without giving money to spotify";



	/* poggers hijacking */

	log(m) {
		console.log(
			`%c[%c${this.getName()}%c] %c${m}`,
			'font-weight: bold; color: #118239',
			'font-weight: bold; color: #1ED760',
			'font-weight: bold; color: #118239', ''
		);
	}

	load() {
		if (window.realPremiumFunctions) {
			this.log('global reference already exists');
		} else {
			window.realPremiumFunctions = {};
			window.realPremiumFunctions.ensureSpotifyPremium = BdApi.findModuleByProps('ensureSpotifyPremium').ensureSpotifyPremium;
			window.realPremiumFunctions.isSpotifyPremium     = BdApi.findModuleByProps('isSpotifyPremium').ensureSpotifyPremium;
			this.log('created global reference');
		}
	}

	start() {
		BdApi.findModuleByProps('ensureSpotifyPremium').ensureSpotifyPremium = () => {
			this.log('intercepted ensureSpotifyPremium');
			return Promise.resolve();
		}
		BdApi.findModuleByProps('isSpotifyPremium').isSpotifyPremium = () => {
			this.log('intercepted isSpotifyPremium');
			return true
		}
	}

	stop() {
		BdApi.findModuleByProps('ensureSpotifyPremium').ensureSpotifyPremium = window.realPremiumFunctions.ensureSpotifyPremium;
		BdApi.findModuleByProps('isSpotifyPremium').isSpotifyPremium         = window.realPremiumFunctions.isSpotifyPremium;
	}
}
