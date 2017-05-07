(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Loader v1.06');
function WebAudioFontLoader(player) {
	this.player = player;
	this.cached = [];
	this.startLoad = function (audioContext, filePath, variableName) {
		if (window[variableName]) {
			return;
		}
		for (var i = 0; i < this.cached.length; i++) {
			if (this.cached[i].variableName == variableName) {
				return;
			}
		}
		this.cached.push({
			filePath : filePath,
			variableName : variableName
		});
		var r = document.createElement('script');
		r.setAttribute("type", "text/javascript");
		r.setAttribute("src", filePath);
		document.getElementsByTagName("head")[0].appendChild(r);
		this.decodeAfterLoading(audioContext,variableName);
	};
	this.decodeAfterLoading = function (audioContext,variableName) {
		var me = this;
		this.waitOrFinish(variableName, function () {
			me.player.adjustPreset(audioContext, window[variableName]);
		});
	};
	this.waitOrFinish = function (variableName, onFinish) {
		if (window[variableName]) {
			onFinish();
		} else {
			var me = this;
			setTimeout(function () {
				me.waitOrFinish(variableName, onFinish);
			}, 111);
		}
	};
	this.loaded = function (variableName) {
		if (!(window[variableName])) {
			return false;
		}
		var preset = window[variableName];
		for (var i = 0; i < preset.zones.length; i++) {
			if (!(preset.zones[i].buffer)) {
				return false;
			}
		}
		return true;
	};
	this.progress = function () {
		if (this.cached.length > 0) {
			for (var k = 0; k < this.cached.length; k++) {
				if (!this.loaded(this.cached[k].variableName)) {
					return k / this.cached.length;
				}
			}
			return 1;
		} else {
			return 1;
		}
	};
	this.waitLoad = function (onFinish) {
		var me = this;
		if (this.progress() >= 1) {
			onFinish();
		} else {
			setTimeout(function () {
				me.waitLoad(onFinish);
			}, 333);
		}
	};
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontLoader;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontLoader = WebAudioFontLoader;
}

},{}],2:[function(require,module,exports){
'use strict'
console.log('WebAudioFont Player v2.59');
var WebAudioFontLoader = require('./loader')
function WebAudioFontPlayer() {
	this.envelopes = [];
	this.loader = new WebAudioFontLoader(this);
	this.onCacheFinish = null;
	this.onCacheProgress = null;
	this.afterTime = 0.05;
	this.nearZero = 0.000001;
	this.queueWaveTable = function (audioContext, target, preset, when, pitch, duration, volume, slides) {
		if (volume) {
			volume = 1.0 * volume;
		} else {
			volume = 1.0;
		}
		var zone = this.findZone(audioContext, preset, pitch);
		if (!(zone.buffer)) {
			console.log('empty buffer ', zone);
			return;
		}
		var baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
		var playbackRate = 1.0 * Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
		var sampleRatio = zone.sampleRate / audioContext.sampleRate;
		var startWhen = when;
		if (startWhen < audioContext.currentTime) {
			startWhen = audioContext.currentTime;
		}
		var waveDuration = duration + this.afterTime;
		var loop = true;
		if (zone.loopStart < 1 || zone.loopStart >= zone.loopEnd) {
			loop = false;
		}
		if (!loop) {
			if (waveDuration > zone.buffer.duration / playbackRate) {
				waveDuration = zone.buffer.duration / playbackRate;
			}
		}
		var envelope = this.findEnvelope(audioContext, target, startWhen, waveDuration);
		this.setupEnvelope(audioContext, envelope, zone, volume, startWhen, waveDuration, duration);
		envelope.audioBufferSourceNode = audioContext.createBufferSource();
		envelope.audioBufferSourceNode.playbackRate.value = playbackRate;
		if (slides) {
			if (slides.length > 0) {
				envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, when);
				for (var i = 0; i < slides.length; i++) {
					var newPlaybackRate = 1.0 * Math.pow(2, (100.0 * slides[i].pitch - baseDetune) / 1200.0);
					var newWhen = when + slides[i].when;
					envelope.audioBufferSourceNode.playbackRate.linearRampToValueAtTime(newPlaybackRate, newWhen);
				}
			}
		}
		envelope.audioBufferSourceNode.buffer = zone.buffer;
		if (loop) {
			envelope.audioBufferSourceNode.loop = true;
			envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate;
			envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate;
		} else {
			envelope.audioBufferSourceNode.loop = false;
		}
		envelope.audioBufferSourceNode.connect(envelope);
		envelope.audioBufferSourceNode.start(startWhen);
		envelope.audioBufferSourceNode.stop(startWhen + waveDuration);
		envelope.when = startWhen;
		envelope.duration = waveDuration;
		envelope.pitch = pitch;
		envelope.preset = preset;
		return envelope;
	};
	this.noZeroVolume = function (n) {
		if (n > this.nearZero) {
			return n;
		} else {
			return this.nearZero;
		}
	};
	this.setupEnvelope = function (audioContext, envelope, zone, volume, when, sampleDuration, noteDuration) {
		envelope.gain.value = this.noZeroVolume(0);
		envelope.gain.exponentialRampToValueAtTime(this.noZeroVolume(0), audioContext.currentTime);
		var lastTime = 0;
		var lastVolume = 0;
		var duration = noteDuration;
		var ahdsr = zone.ahdsr;
		if (sampleDuration < duration + this.afterTime) {
			duration = sampleDuration - this.afterTime;
		}
		if (ahdsr) {
			if (!(ahdsr.length > 0)) {
				ahdsr = [{
						duration : 0,
						volume : 1
					}, {
						duration : 0.5,
						volume : 1
					}, {
						duration : 1.5,
						volume : 0.5
					}, {
						duration : 3,
						volume : 0
					}
				];
			}
		} else {
			ahdsr = [{
					duration : 0,
					volume : 1
				}, {
					duration : duration,
					volume : 1
				}
			];
		}
		envelope.gain.linearRampToValueAtTime(this.noZeroVolume(0), when - this.nearZero);
		envelope.gain.cancelScheduledValues(when);
		envelope.gain.exponentialRampToValueAtTime(ahdsr[0].volume * volume, when);
		for (var i = 0; i < ahdsr.length; i++) {
			if (ahdsr[i].duration > 0) {
				if (ahdsr[i].duration + lastTime > duration) {
					var r = 1 - (ahdsr[i].duration + lastTime - duration) / ahdsr[i].duration;
					var n = lastVolume - r * (lastVolume - ahdsr[i].volume);
					envelope.gain.linearRampToValueAtTime(this.noZeroVolume(volume * n), when + duration);
					break;
				}
				lastTime = lastTime + ahdsr[i].duration;
				lastVolume = ahdsr[i].volume;
				envelope.gain.linearRampToValueAtTime(this.noZeroVolume(volume * lastVolume), when + lastTime);
			}
		}
		envelope.gain.linearRampToValueAtTime(this.noZeroVolume(0), when + duration + this.afterTime);
	};
	this.numValue = function (aValue, defValue) {
		if (typeof aValue === "number") {
			return aValue;
		} else {
			return defValue;
		}
	};
	this.findEnvelope = function (audioContext, target, when, duration) {
		var envelope = null;
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			if (e.target == target && audioContext.currentTime > e.when + e.duration + 0.1) {
				try {
					e.audioBufferSourceNode.disconnect();
					e.audioBufferSourceNode.stop(0);
					e.audioBufferSourceNode = null;
				} catch (x) {
					//audioBufferSourceNode is dead already
				}
				envelope = e;
				break;
			}
		}
		if (!(envelope)) {
			envelope = audioContext.createGain();
			envelope.target = target;
			envelope.connect(target);
			envelope.cancel = function () {
				if (envelope.when + envelope.duration > audioContext.currentTime) {
					envelope.gain.cancelScheduledValues(0);
					envelope.gain.setTargetAtTime(0.00001, audioContext.currentTime, 0.1);
					envelope.when = audioContext.currentTime + 0.00001;
					envelope.duration = 0;
				}
			};
			this.envelopes.push(envelope);
		}
		return envelope;
	};
	this.adjustPreset = function (audioContext, preset) {
		for (var i = 0; i < preset.zones.length; i++) {
			this.adjustZone(audioContext, preset.zones[i]);
		}
	};
	this.adjustZone = function (audioContext, zone) {
		if (zone.buffer) {
			//
		} else {
			if (zone.sample) {
				var decoded = atob(zone.sample);
				zone.buffer = audioContext.createBuffer(1, decoded.length / 2, zone.sampleRate);
				var float32Array = zone.buffer.getChannelData(0);
				var b1,
				b2,
				n;
				for (var i = 0; i < decoded.length / 2; i++) {
					b1 = decoded.charCodeAt(i * 2);
					b2 = decoded.charCodeAt(i * 2 + 1);
					if (b1 < 0) {
						b1 = 256 + b1;
					}
					if (b2 < 0) {
						b2 = 256 + b2;
					}
					n = b2 * 256 + b1;
					if (n >= 65536 / 2) {
						n = n - 65536;
					}
					float32Array[i] = n / 65536.0;
				}
			} else {
				if (zone.file) {
					var datalen = zone.file.length;
					var arraybuffer = new ArrayBuffer(datalen);
					var view = new Uint8Array(arraybuffer);
					var decoded = atob(zone.file);
					var b;
					for (var i = 0; i < decoded.length; i++) {
						b = decoded.charCodeAt(i);
						view[i] = b;
					}
					audioContext.decodeAudioData(arraybuffer, function (audioBuffer) {
						zone.buffer = audioBuffer;
					});
				}
			}
			zone.loopStart = this.numValue(zone.loopStart, 0);
			zone.loopEnd = this.numValue(zone.loopEnd, 0);
			zone.coarseTune = this.numValue(zone.coarseTune, 0);
			zone.fineTune = this.numValue(zone.fineTune, 0);
			zone.originalPitch = this.numValue(zone.originalPitch, 6000);
			zone.sampleRate = this.numValue(zone.sampleRate, 44100);
			zone.sustain = this.numValue(zone.originalPitch, 0);
		}
	};
	this.findZone = function (audioContext, preset, pitch) {
		var zone = null;
		for (var i = preset.zones.length - 1; i >= 0; i--) {
			zone = preset.zones[i];
			if (zone.keyRangeLow <= pitch && zone.keyRangeHigh >= pitch) {
				break;
			}
		}
		try {
			this.adjustZone(audioContext, zone);
		} catch (ex) {
			//console.log(ex);
		}
		return zone;
	};
	this.cancelQueue = function (audioContext) {
		for (var i = 0; i < this.envelopes.length; i++) {
			var e = this.envelopes[i];
			e.gain.cancelScheduledValues(0);
			e.gain.setValueAtTime(this.nearZero, audioContext.currentTime);
			e.when = -1;
			try {
				e.audioBufferSourceNode.disconnect();
			} catch (ex) {
				console.log(ex);
			}
		}
	};
	return this;
}
if (typeof module === 'object' && module.exports) {
	module.exports = WebAudioFontPlayer;
}
if (typeof window !== 'undefined') {
	window.WebAudioFontPlayer = WebAudioFontPlayer;
}

},{"./loader":1}]},{},[2]);
