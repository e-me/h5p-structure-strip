import StructureStripFeedback from './h5p-structure-strip-feedback';
import StructureStripSegment from './h5p-structure-strip-segment';
import Util from './h5p-structure-strip-util';

/** Class representing the content */
export default class StructureStripContent {
  /**
   * @constructor
   * @param {object} params Parameters.
   */
  constructor(params) {
    this.params = Util.extend({
      segments: [],
      slack: 10
    }, params);

    this.segments = [];

    this.content = document.createElement('div');
    this.content.classList.add('h5p-structure-strip-content');

    if (this.params.taskDescription) {
      const taskDescription = document.createElement('div');
      taskDescription.classList.add('h5p-structure-strip-task-description');
      taskDescription.innerHTML = this.params.taskDescription;
      this.content.appendChild(taskDescription);
    }

    const stripsContainer = document.createElement('div');
    stripsContainer.classList.add('h5p-structure-strip-text-strips-container');
    this.content.appendChild(stripsContainer);

    // Build strips
    this.params.segments.forEach((segment, index) => {
      const instanceSegment = new StructureStripSegment({
        callbackContentChanged: () => {
          this.updateSegments();
        },
        colorBackground: segment.colorBackground,
        colorText: segment.colorText,
        description: segment.description,
        feedbackMode: this.params.feedbackMode,
        id: index,
        text: (this.params.previousState.texts) ? this.params.previousState.texts[index] : '',
        title: segment.title || '',
        weight: segment.weight
      });
      this.segments.push(instanceSegment);
      stripsContainer.appendChild(instanceSegment.getDOM());
    });

    if (this.params.feedbackMode === 'onRequest') {
      // Build feedback
      this.feedback = new StructureStripFeedback({
        title: 'Feedback'
      });
      this.content.appendChild(this.feedback.getDOM());
    }

    // Determine reference segment
    this.mostImportantSegment = this.segments.reduce( (previous, current) => {
      if (!previous) {
        return current;
      }
      return (current.getWeight() > previous.getWeight()) ? current : previous;
    });

    this.greatestCommonDivisor = Util.greatestCommonDivisorArray(this.segments.map(segment => segment.getWeight()));

    if (this.params.feedbackMode === 'continuously') {
      this.updateSegments();
    }
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Return the text of all strips.
   * @return {object[]} Texts of all strips.
   */
  getText(concatenated = false) {
    const texts = this.segments.map(strip => strip.getText());
    return concatenated ? texts.filter(text => text !== '').join('\n') : texts;
  }

  /**
   * Hide feedback.
   */
  hideFeedback() {
    if (this.params.feedbackMode !== 'onRequest') {
      return;
    }
    this.feedback.hide();
  }

  /**
   * Enable segments.
   */
  enableSegments() {
    this.segments.forEach(segment => {
      segment.enable();
    });
  }

  /**
   * Update segments' status.
   * TODO: Only update all segments if reference segment was changed.
   */
  updateSegments() {
    if (this.params.feedbackMode !== 'continuously') {
      return;
    }

    const feedbackTexts = this.buildFeedbackTexts({
      tooLong: this.params.l10n.tooLong,
      tooShort: this.params.l10n.tooShort
    });

    feedbackTexts.forEach( (text, index) => {
      this.segments[index].setStatus(text || '&nbsp;');
    });
  }

  /**
   * Build feedback texts.
   * @param {object} textTemplates Texts.
   * @param {string} textTemplates.alright Text for good section length.
   * @param {string} textTemplates.tooLong Text for section that is too long.
   * @param {string} textTemplates.tooShort Text for section that is too short.
   * @param {string[]} Feedback texts.
   */
  buildFeedbackTexts(textTemplates) {
    const referenceLength = Math.max(this.mostImportantSegment.getText().length, this.mostImportantSegment.getWeight() / this.greatestCommonDivisor);
    const normalizedReferenceLength = referenceLength / this.mostImportantSegment.getWeight();
    const normalizedLengthMax = normalizedReferenceLength * (1 + this.params.slack / 100);
    const normalizedLengthMin = normalizedReferenceLength * (1 - this.params.slack / 100);

    const feedbackTexts = [];
    this.segments.forEach(segment => {
      const normalizedLength = segment.getText().length / segment.getWeight();

      let gap;

      if (normalizedLength > normalizedLengthMax) {

        // Too long compared to reference
        gap = Math.floor((normalizedLength - normalizedLengthMax) * segment.getWeight());
        if (gap === 0) {
          // Compensate for tiny text lengths
          feedbackTexts.push(null);
        }
        else {
          feedbackTexts.push(
            textTemplates.tooLong.replace(/@title/g, segment.getTitle()).replace(/@chars/g, gap)
          );
        }
      }
      else if (normalizedLength < normalizedLengthMin) {

        // To short compared to reference
        gap = Math.ceil((normalizedLengthMin - normalizedLength) * segment.getWeight());
        feedbackTexts.push(
          textTemplates.tooShort.replace(/@title/g, segment.getTitle()).replace(/@chars/g, gap)
        );
      }
      else {

        // Alright
        feedbackTexts.push(textTemplates.alright);
      }
    });

    return feedbackTexts;
  }

  /**
   * Check answer.
   */
  checkAnswer() {
    if (this.params.feedbackMode !== 'onRequest') {
      return;
    }

    this.segments.forEach(segment => {
      segment.disable();
    });

    let feedbackTexts = this.buildFeedbackTexts({
      alright: null,
      tooLong: this.params.l10n.segmentTooLong,
      tooShort: this.params.l10n.segmentTooShort
    });

    feedbackTexts = feedbackTexts.filter(text => text !== null);

    // Compute feedback text HTML
    let feedbackTextHTML = '';
    if (feedbackTexts.length === 0) {
      feedbackTextHTML = `<p>${this.params.l10n.allSegmentsGood}</p>`;
    }
    else if (feedbackTexts.length === 1) {
      feedbackTextHTML = `<p>${feedbackTexts[0]}</p>`;
    }
    else {
      feedbackTextHTML = `<ul>${
        feedbackTexts.reduce((previous, current) => `${previous}<li>${current}</li>`, '')
      }</ul>`;
    }

    this.feedback.setText(feedbackTextHTML);
    this.feedback.show();
  }
}
