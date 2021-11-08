/**
 * @name Petrify
 * @version 0.1.3
 * @author Pi
 * @description spoof mute, deafen, and camera 
 * @website https://github.com/pipipear/BD
 * @source https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Petrify/Petrify.plugin.js
 * @updateUrl https://raw.githubusercontent.com/pipipear/BD/main/Plugins/Petrify/Petrify.plugin.js
 */


class Petrify {
	log(m) {
		console.log(
			`%c[%cPetrify%c] %c${m}`,
			'font-weight: bold; color: #1f7fbf',
			'font-weight: bold; color: #63e5f3',
			'font-weight: bold; color: #1f7fbf', ''
		);
	}

	load() {
    BdApi.injectCSS('Petrify-CSS', `
      button[aria-label$="Camera"][data-petrify="true"] {
        background-color: #458bc4;
      }
      button[aria-label$="Camera"][data-petrify="true"]:hover {
        background-color: #49abc9;
      }
    `);

    if (window.wvm) {
			this.log('global reference already exists');
		} else {
      var tmpvcf = BdApi.findModuleByProps('toggleSelfMute');
      var tmpvsf = BdApi.findModuleByPrototypes('voiceStateUpdate');
      window.wvm = {
        README: "this key-value array holds important vc data, it was automatically generated by the Petrify plugin",
        vcf: tmpvcf,
        vsf: tmpvsf,
        vsu: tmpvsf.prototype.voiceStateUpdate,
        sve: tmpvcf.setVideoEnabled,
        tsm: tmpvcf.toggleSelfMute,
        tsd: tmpvcf.toggleSelfDeaf,
        pVsu: [],
        fVide: () => document.querySelector('button[aria-label$="Camera"]')?.dataset?.petrify == 'true',
        sMute: false,
        sDeaf: false,
        rVide: () => !!document.querySelector('button[aria-label="Turn On Camera"]'),
        rMute: () => !!document.querySelector('button[aria-label="Mute"][aria-checked="true"]'),
        rDeaf: () => !!document.querySelector('button[aria-label="Deafen"][aria-checked="true"]'),
        cVide: (s) => {
          if (wvm.pVsu.length) {
            document.querySelector('button[aria-label$="Camera"]').dataset.petrify = s;
            wvm.vsf.prototype.voiceStateUpdate.apply(wvm.pVsu[0], wvm.pVsu[1])
          } else {
            BdApi.alert('Petrify - Delayed injection', 'toggle mute or deafen then try again');
          }
        },
        cMute: (s) => {
          wvm.sMute = s;
          s ? document.querySelector('button[aria-label="Mute"]').style.color = '#63e5f3' : document.querySelector('button[aria-label="Mute"]').style.color = '';
        },
        cDeaf: (s) => {
          wvm.sDeaf = s;
          s ? document.querySelector('button[aria-label="Deafen"]').style.color = '#63e5f3' : document.querySelector('button[aria-label="Deafen"]').style.color = '';
        },
        eRoute: (e) => {
          if (document.querySelector('button[aria-label="Turn On Camera"]')?.contains(e.target)) {
            if (e.altKey && !wvm.fVide()) {
              e.preventDefault();
              e.stopPropagation();
              wvm.cVide(true);
              wvm.log('video manipulated');
            } else if (wvm.fVide()) {
              e.preventDefault();
              e.stopPropagation();
              wvm.cVide(false);
            }
          } else if (!e.altKey) {
            return
          } else if (document.querySelector('button[aria-label="Mute"]').contains(e.target) && wvm.rMute()) {
            e.preventDefault();
            e.stopPropagation();
            wvm.cMute(true);
            wvm.tsm();
            wvm.log('mute manipulated');
          } else if (document.querySelector('button[aria-label="Deafen"]').contains(e.target) && wvm.rDeaf()) {
            e.preventDefault();
            e.stopPropagation();
            wvm.cDeaf(true);
            wvm.tsd();
            !wvm.rMute() && wvm.tsm();
            wvm.log('deafen manipulated');
          }
        },
        log: this.log
      }
    }

    BdApi.findModuleByPrototypes('voiceStateUpdate').prototype.voiceStateUpdate = function () {
      wvm.pVsu = [this, [...arguments]]
      wvm.log(JSON.stringify(arguments));
      let newargs = [...arguments];
      newargs[2] = arguments[2] || wvm.sMute || wvm.attFx;
      newargs[3] = arguments[3] || wvm.sDeaf;
      newargs[4] = arguments[4] || wvm.fVide();
      return wvm.vsu.apply(this, newargs);
    };
	}

	async start() {
    wvm.vcf.setVideoEnabled = function () {
      wvm.cVide(false);
      return wvm.sve.apply(this, arguments);
    };

    wvm.vcf.toggleSelfMute = function () {
      wvm.cMute(false);
      return wvm.tsm.apply(this, arguments);
    };

    wvm.vcf.toggleSelfDeaf = function () {
      wvm.cMute(false);
      wvm.cDeaf(false);
      return wvm.tsd.apply(this, arguments);
    };

    var waitextra = !document.querySelector('button[aria-label="Mute"]');

    while (!document.querySelector('button[aria-label="Mute"]') || document.querySelector('video[class^=ready-][autoplay][playsinline]')) {
      wvm.log('waiting for ui to load...');
      await new Promise(r => setTimeout(r, 500));
    }

    document.body.addEventListener('click', wvm.eRoute, true);
    this.log('patched voice functions');
  }
    
  stop() {
    if (wvm.fVide()) wvm.cVide(false);
    if (wvm.sMute) wvm.tsm(), wvm.cMute(false);
    if (wvm.sDeaf) wvm.tsd(), wvm.cDeaf(false);
    wvm.vcf.setVideoEnabled = wvm.sve
    wvm.vcf.toggleSelfMute = wvm.tsm;
    wvm.vcf.toggleSelfDeaf = wvm.tsd;
    document.body.removeEventListener('click', wvm.eRoute, true);
    this.log('unpatched voice functions');
	}
}
