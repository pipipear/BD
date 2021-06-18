/**
 * @name Premium
 * @version 0.1.4
 * @author Pi
 * @description become epic hacker and listen along without giving money to spotify
 * @website https://github.com/pipipear/BD
 * @source https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Premium/Premium.plugin.js
 * @updateUrl https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Premium/Premium.plugin.js
 */

class Premium {
	log(m) {
		console.log(
			`%c[%cPremium%c] %c${m}`,
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
			this.log('created new global reference');
		}
	}

	start() {
		BdApi.findModuleByProps('ensureSpotifyPremium').ensureSpotifyPremium = () => {
			this.log('ensureSpotifyPremium bypassed');
			return Promise.resolve();
		}
		BdApi.findModuleByProps('isSpotifyPremium').isSpotifyPremium = () => {
			this.log('isSpotifyPremium bypassed');
			return true
		}
		this.log('patched premium checks');
	}
	
	stop() {
		BdApi.findModuleByProps('ensureSpotifyPremium').ensureSpotifyPremium = window.realPremiumFunctions.ensureSpotifyPremium;
		BdApi.findModuleByProps('isSpotifyPremium').isSpotifyPremium         = window.realPremiumFunctions.isSpotifyPremium;
		this.log('unpatched premium checks');
	}
}
