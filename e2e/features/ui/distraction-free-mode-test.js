const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const {
  geosearchMinimizeButton,
  geosearchToolbarButton,
  mapScaleImperial,
  mapScaleMetric,
  measureBtn,
  projToolbarButton,
  shareToolbarButton,
  sidebarContainer,
  snapshotToolbarButton,
  timelineContainer,
  zoomInButton,
  zoomOutButton,
} = localSelectors;
const TIME_LIMIT = 5000;

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
    c.url(`${c.globals.url}?p=arctic`);
    // ensure geosearch is minimized
    c.click(geosearchMinimizeButton);
  },

  // verify distraction free mode shortcut hides ui elements
  'Enabling distraction free mode with shortcut key hides UI elements': (c) => {
    c.waitForElementVisible('#wv-info-button');
    c.click('#wv-info-button');
    c.waitForElementVisible('#distraction_free_info_item');
    c.click('#distraction_free_info_item');
    c.pause(300);

    c.waitForElementNotVisible(timelineContainer, TIME_LIMIT);
    c.waitForElementNotVisible(sidebarContainer, TIME_LIMIT);
    c.waitForElementNotVisible(geosearchToolbarButton, TIME_LIMIT);
    c.waitForElementNotPresent(shareToolbarButton, TIME_LIMIT);
    c.waitForElementNotPresent(projToolbarButton, TIME_LIMIT);
    c.waitForElementNotPresent(snapshotToolbarButton, TIME_LIMIT);
    c.waitForElementNotVisible(measureBtn, TIME_LIMIT);
    c.waitForElementNotPresent(zoomInButton, TIME_LIMIT);
    c.waitForElementNotPresent(zoomOutButton, TIME_LIMIT);
    c.waitForElementNotVisible(mapScaleMetric, TIME_LIMIT);
    c.waitForElementNotVisible(mapScaleImperial, TIME_LIMIT);
    c.waitForElementNotPresent('.wv-map-rotate-left', TIME_LIMIT);
    c.waitForElementNotPresent('.wv-map-reset-rotation', TIME_LIMIT);
    c.waitForElementNotPresent('.wv-map-rotate-right', TIME_LIMIT);
  },

  // verify turning off distraction free mode shortcut returns hidden ui elements
  'Disabling distraction free mode with shortcut key returns UI elements': (c) => {
    c.sendKeys('body', [c.Keys.SHIFT, 'd', c.Keys.NULL]);
    c.pause(500);

    c.waitForElementVisible(timelineContainer, TIME_LIMIT);
    c.waitForElementVisible(sidebarContainer, TIME_LIMIT);
    c.waitForElementVisible(geosearchToolbarButton, TIME_LIMIT);
    c.waitForElementVisible(shareToolbarButton, TIME_LIMIT);
    c.waitForElementPresent(projToolbarButton, TIME_LIMIT);
    c.waitForElementPresent(snapshotToolbarButton, TIME_LIMIT);
    c.waitForElementVisible(measureBtn, TIME_LIMIT);
    c.waitForElementPresent(zoomInButton, TIME_LIMIT);
    c.waitForElementPresent(zoomOutButton, TIME_LIMIT);
    c.waitForElementPresent(mapScaleMetric, TIME_LIMIT);
    c.waitForElementPresent(mapScaleImperial, TIME_LIMIT);
    c.waitForElementPresent('.wv-map-rotate-left', TIME_LIMIT);
    c.waitForElementPresent('.wv-map-reset-rotation', TIME_LIMIT);
    c.waitForElementPresent('.wv-map-rotate-right', TIME_LIMIT);
  },

  after: (c) => {
    c.end();
  },
};
