import AudioModule from "audio_modules/core/audio-module";
import verifyAudioContextFeatures from "audio_modules/core/verify-audio-context-features";
import OscillatorVoice from "audio_modules/oscillator-voice";
import Envelope from "audio_modules/envelope";
import ChannelStrip from "audio_modules/channel-strip";
import AudioUtil from "audio_modules/core/util";

/**
 * Class representing an Additive Synth Voice
 // TODO: WRITE DESCRIPTION
 * @class
 */
class AdditiveSynthVoice extends AudioModule {

  /**
   * @constructor
   * @param {AudioContext} audioCtx
   * @param {object} o - Options.
   // TODO: ANNOTATE OPTIONS
   */
  constructor(audioCtx, o) {
    super(audioCtx);  
  }

  /* ============================================================================================= */
  /*  INITIALIZATION METHODS
  /* ============================================================================================= */

  /**
   * Initialize audio components and their connections.
   * @private @override
   */
  _initAudioComponents() {
    const _this = this;

    try {
      verifyAudioContextFeatures(_this.audioCtx, []);

      this.audioComponents = {

        overtones: (function() {
          let ot = [];

          for (let i = 0; i < _this.o.numOvertones; i++) {
            ot.push(new OscillatorVoice(_this.audioCtx));
          }

          return ot;
        }()),

        envelope: new Envelope(_this.audioCtx),

        channelStrip: new ChannelStrip(_this.audioCtx)
      };

      _this.audioComponents.overtones.forEach(ot => {
        ot.connect(_this.audioComponents.envelope);
      });
      _this.audioComponents.envelope.connect(_this.audioComponents.channelStrip);
      _this.audioComponents.channelStrip.connect(_this.output);       
    } catch(err) {
      console.error(err);
    }
  }

  /**
   * Initialize and expose Audio Params.
   * @private @abstract
   */
  _initAudioParams() {
    this.pan = this.audioComponents.channelStrip.pan;
    this.gain = this.audioComponents.channelStrip.outputGain;
    // TODO: can also expose frequency as frequency of first overtone?
  }

  /**
   * Initialize options.
   * @private @override
   */
  _initOptions(o) {

    this.o = {
      numOvertones: 10,
      glide: 0
    };

    super._initOptions(o);
  }

  /* ============================================================================================= */
  /*  GETTERS AND SETTERS
  /* ============================================================================================= */ 

  /**
   * Returns the gain.
   * @returns {number} - Gain.
   */
  getGain() {
    return this.audioComponents
                .channelStrip
                .getOutputGain();
  }

  /**
   * Sets the gain.
   * @param {number} gain - Gain between 0. and 1.
   */
  setGain(gain) {
    this.audioComponents
          .channelStrip
          .setOutputGain(gain);
    return this;
  }

  /**
   * Returns the pan.
   * @returns {number} - Pan.
   */
  getPan() {
    return this.audioComponents
                .channelStrip
                .getPan();
  }
  
  /**
   * Sets the pan.
   * @param {number} pan - Pan between -1. (L) and 1. (R).
   */
  setPan(pan) {
    this.audioComponents
          .channelStrip
          .setPan(pan);
    return this;
  }

  /**
   * Returns the oscillator frequency.
   * @returns {number} - Oscillator frequency.
   */
  getFrequency() {
    let freq = this.audioComponents.overtones[0].getFrequency();
    return freq;
  }

  /**
   * Sets the oscillator frequency.
   * @param {number} freq - Frequency.
   * @param {number} [glide] - Glide time in ms.
   */
  setFrequency(freq, glide) {
    let overtones = this.audioComponents.overtones;

    glide = (glide === undefined) ? this.o.glide : glide;

    overtones.forEach((ot, otIdx) => {
      ot.setFrequency(freq * (otIdx + 1))
    });

    return this;
  }

  /**
   * Get either the main attack envelope, or the attack envelope for
   * one of the overtones.
   * @param {number} [otIdx] - Index of the overtone whose attack envelope to return.
   * @returns {array} - 2D array representing the attack envelope.
   */
  getAttackEnvelope(otIdx) {
    let env = [];

    if (typeof otIdx === "number") {
      env = this.audioComponents.overtones[otIdx].getAttackEnvelope();
    } else {
      env = this.audioComponents.envelope.getAttackEnvelope();
    }

    return env;
  }

  /**
   * Set either the main attack envelope, or the attack envelope for
   * one of the overtones.
   * @param {array} env - A 2D array representing the new envelope, where each value is of the
   *                         form [t, a] where t is time in seconds, and a is amplitude in the range
   *                         [0. - 1.]
   * @param {number} otIdx - Index of the overtone whose attack envelope to set.
   * @returns {this} - A reference to the current object for chaining.
   */
  setAttackEnvelope(env, otIdx) {
    let target = {};

    if (typeof otIdx === "number") {
      target = this.audioComponents.overtones[otIdx];
    } else {
      target = this.audioComponents.envelope;
    }

    target.setAttackEnvelope(env);

    return this;
  }

  /**
   * Get either the main release envelope, or the release envelope for
   * one of the overtones.
   * @param {number} [otIdx] - Index of the overtone whose release envelope to return.
   * @returns {array} - 2D array representing the release envelope.
   */
  getReleaseEnvelope(otIdx) {
    let env = [];

    if (typeof otIdx === "number") {
      env = this.audioComponents.overtones[otIdx].getReleaseEnvelope();
    } else {
      env = this.audioComponents.envelope.getReleaseEnvelope();
    }

    return env;
  }

  /**
   * Set either the main release envelope, or the release envelope for
   * one of the overtones.
   * @param {array} env - A 2D array representing the new envelope, where each value is of the
   *                         form [t, a] where t is time in seconds, and a is amplitude in the range
   *                         [0. - 1.]
   * @param {number} otIdx - Index of the overtone whose release envelope to set.
   * @returns {this} - A reference to the current object for chaining.
   */
  setReleaseEnvelope(env) {
    let taget = {};
    
    if (typeof otIdx === "number") {
      target = this.audioComponents.overtones[otIdx];
    } else {
      target = this.audioComponents.envelope;
    }

    target.setReleaseEnvelope(env);

    return this;
  }

  /**
   * Set the gain of an overtone.
   * @param {number} gain - Gain - value in the range [0. - 1.]
   * @param {number} otIdx - Overtone index. 
   */
  setOvertoneGain(gain, otIdx) {
    if (otIdx >= 0 && otIdx < this.audioComponents.overtones.length) {
      this.audioComponents.overtones[otIdx].setGain(gain);
    }
  }

  /**
   * Set the gain for multiple overtones using an array.
   * @param {array} gainArr
   */
  setOvertoneGains(gainArr) {
    for (let i = 0; (i < this.audioComponents.overtones.length) && (i < gainArr.length); i++) {
      this.setOvertoneGain(gainArr[i], i);
    }
  }

  /**
   * Get the number of overtones.
   * @returns {number} - Number of overtones.
   */
  getNumOvertones() {
    return this.audioComponents.overtones.length;
  }

  /**
   * Set the number of overtones.
   * @param {number} newNumOvertones - Number of overtones. 
   */
  setNumOvertones(newNumOvertones) {
    let curNumOvertones = this.getNumOvertones();

    if (curNumOvertones > newNumOvertones) {
      for (let i = curNumOvertones; i > newNumOvertones; i--) {
        this.audioComponents.overtones[i] = null;
        this.audioComponents.overtones.pop();
      }
    } else if (curNumOvertones < newNumOvertones) {
      let baseFreq = this.getFrequency();

      for (let i = curNumOvertones; i < newNumOvertones; i++) {
        let newOscillatorVoice = new OscillatorVoice();
        newOscillatorVoice.setFrequency((i + 1) * baseFreq);
        this.audioComponents.overtones.push(newOscillatorVoice);
      }
    }
  }

  /* ============================================================================================= */
  /*  PUBLIC API
  /* ============================================================================================= */ 

  /**
   * Execute the attack envelope.
   * @returns {Promise} - Promise that returns the envelope when the envelope expires.
   */
  attack() {
    let overtones = this.audioComponents.overtones;

    overtones.forEach(ot => {
      ot.attack();
    });

    return this.audioComponents.envelope.attack();
  }

  /**
   * Execute the release envelope.
   * @returns {Promise} - Promise that returns the envelope when the envelope expires.
   */
  release() {
    let overtones = this.audioComponents.overtones;
    
    overtones.forEach(ot => {
      ot.release();
    });
    

    return this.audioComponents.envelope.release();
  }

  /**
   * Play a note with the given MIDI pitch and MIDI velocity.
   * @public
   * @param {number} pitch - MIDI pitch.
   * @param {number} [vel=127] - MIDI velocity. 
   * @param {array} [glide] - Glide time in ms.
   */
  playNote(pitch, vel = 127, glide) {
    let freq = AudioUtil.midiToFreq(pitch);
    let gain = AudioUtil.midiVelToGain(vel);

    if (vel === 0) {
      this.release();
    } else {
      this.setFrequency(freq, glide);
      this.setGain(gain);
      this.attack();
    }
  }
}

export default AdditiveSynthVoice;