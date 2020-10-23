/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @param {object} arguments Objects to be merged.
   * @return {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Compute greatest common divisor.
   * @param {number} [a=1] First number.
   * @param {number} [b=1] Second number.
   * @return {number} Greatest common divisor.
   */
  static greatestCommonDivisor(a = 1, b = 1) {
    return (!b) ? a : Util.greatestCommonDivisor(b, a % b);
  }

  /**
   * Compute greatest common divisor.
   * @param {number[]} numbers Numbers.
   * @return {number} Greatest common divisor.
   */
  static greatestCommonDivisorArray(numbers) {
    return numbers.reduce((previous, current) => {
      if (!previous) {
        return 1;
      }

      return Util.greatestCommonDivisor(previous, current);
    });
  }

  /**
   * Copy text to clipboard.
   * Cmp. https://stackoverflow.com/a/30810322
   * @param {string} text Text to copy to clipboard.
   * @param {function} [callback] Callback accepting true/false as param.
   */
  static copyTextToClipboard(text, callback = () => {}) {
    if (!navigator.clipboard) {
      Util.fallbackCopyTextToClipboard(text, callback);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      callback(true);
    }, error => {
      console.error('Cannot copy to clipboard: ', error);
      callback(false);
    });
  }

  /**
   * Copy text to clipboard.
   * @param {string} text Text to copy.
   * @param {function} [callback] Callback accepting true/false as param.
   */
  static fallbackCopyTextToClipboard(text, callback = () => {}) {
    const textArea = document.createElement('textarea');

    // Place in top-left corner of screen regardless of scroll position
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure small width/height. 1px / 1em gives negative w/h on some browsers
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // Reduce size if flashing when rendering
    textArea.style.padding = 0;

    // Clean up any borders
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let result = true;
    try {
      document.execCommand('copy');
    }
    catch (error) {
      console.warn('Cannot copy to clipboard.');
      result = false;
    }

    document.body.removeChild(textArea);
    callback(result);
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageTag Language tag.
   * @return {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }
}

export default Util;
