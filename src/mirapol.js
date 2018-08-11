'use strict';

import Story from './story.js';

window.Mirapol = Object.seal({
    Story
});

jQuery(() => {
    try {
        console.log('Starting the story');
        console.log(Story);
        Story.load(jQuery('tw-storydata'))
    } catch (ex) {
		console.error(ex);
	}
});