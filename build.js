/*----
Most of this build.js has been made thanks to TheMadExile's own build.js for SugarCube2 (See https://bitbucket.org/tmedwards/sugarcube/)
----*/

//Build configuration
const CONFIG = {
    css : [
		'src/css/normalize.css',
		'src/css/story.css'
    ],
    js : 'src/mirapol.js',
    libs : [
		//{ local : 'src/lib/jquery-3.3.1.min.js', id : 'jquery', remote : 'https://code.jquery.com/jquery-3.3.1.min.js' },
		{ local : 'src/lib/jquery-3.3.1.slim.min.js', id : 'jquery-slim', remote : 'https://code.jquery.com/jquery-3.3.1.slim.min.js' },
		//{ local : 'src/lib/zepto.min.js', id : 'zepto',  remote : 'http://zeptojs.com/zepto.min.js'}
	],
	debug : {
		js : 'dist/mirapol-1/debug/js.js',
		css : 'dist/mirapol-1/debug/css.css',
		lib : 'dist/mirapol-1/debug/lib.js',
		html : 'dist/mirapol-1/debug/index.html'
	},
	src : 'src/index.html',
	out : 'dist/mirapol-1/format.js'
};

//Global includes
const _fs   = require('fs');
const _path = require('path');
const pkg = require('./package.json');

//Get CLI options
const _opt = require('node-getopt').create([
    ['u', 'unminify', 'Suppress minification'],
    ['6', 'es6', 'Keeps the source as ES6 code'],
	['h', 'help', 'Print this help, then exit.'],
	['r', 'remote', 'Don\'t include the libs\'s code, onlt links'],
	['d','debug','Generates separate output for each file type in the dist folder'],
	['t', 'testing', 'Generates a test file using the src/testing/test.html file']
]).bindHelp().parse_system();

//Disable minification for es6
if (_opt.options.es6 && !_opt.options.unminified) {
	_opt.options.unminify = true;
}

//Build Process
(async () => {
    console.log('Building ' + pkg.name + ' version ' + pkg.version);
	await twine2Build();
    console.log('Project built successfully !');
})();

//--------------------
//All the used functions start here
//--------------------

//Twine2 build
async function twine2Build(){
    console.log('Building Twine 2.x compatible release:');

    build({
        lib : assembleLibraries(CONFIG.libs),
        css : minifyCSS(CONFIG.css),
        js : await minifyJS(CONFIG.js),
		src : CONFIG.src,
		out : CONFIG.out,
		debug: _opt.options.debug,
		format : twine2Format(),

		postProcess(source){
			let output = twine2Format(); 
			output.source = source;
			return 'window.storyFormat(' + JSON.stringify(output) + ');';
		}
    });
}

//Twine2 JSON file
function twine2Format(){
    return {
        name : pkg.name,
        version : pkg.version,
        description : pkg.description,
        author : pkg.author.name,
        image : '',
        url : pkg.repository.url,
        license : pkg.license,
        proofing : false
    }
}

//Minify JavaScript
function minifyJS(file){
    console.log('Minifying the JS source')

    //Rollup Includes
    const rollup        = require('rollup');
	const rollupBabel   = require('rollup-plugin-babel');
	const rollupReplace = require('rollup-plugin-replace');
    const rollupUglify  = require('rollup-plugin-uglify');
    
    //Rollup Input Opts
    const rollupInputOpts = {
		input  : _path.resolve('./' + file),
		onwarn : warning => {
			switch (warning.code) {
			    case 'EVAL': // Remove eval() related messages.
                    return;
                default:
                    //Print everything else
                    console.warn(`${warning.code}: ${warning.message}`); 
            }
		},
        treeshake : false, //Diables removal of unused functions
        plugins : [] //For use with later code, dynamically adding plugins
	};

    //Rollup Output Opts
    const rollupOutputOpts = {
		format : 'iife'
    };
    
    //If not ES6, babelify to ES5
    if (!_opt.options.es6) {
        rollupInputOpts.plugins.push(
			rollupBabel({
				code     : true,
				compact  : false,
				presets  : [['env', { modules : false }]],
				plugins  : ['external-helpers'],
				filename : 'mirapol.bundle.js'
			})
		);
    }

    //Minify if required
    if (!_opt.options.unminified) {
		rollupInputOpts.plugins.push(
			rollupUglify()
		);
	}

	async function compile() {
		const bundle   = await rollup.rollup(rollupInputOpts);
		const { code } = await bundle.generate(rollupOutputOpts);
		return _opt.options.unminified ? code : code.trimRight();
    }
    
    return compile();
}

//Minify CSS files
function minifyCSS(files){
    console.log('Minifying the CSS source')
    const postcss = require('postcss');
    const CleanCss = require('clean-css');

    return concatFiles(files, (contents, filename) => {
		let css = contents;

		// Do not run autoprefixer on 'normalize.css'.
		if (filename.indexOf('normalize.css') !== -1) {
			const processed = postcss([require('autoprefixer')]).process(css, { from : filename });
			css = processed.css;
			processed.warnings().forEach(msg => console.warn(msg.text));
		}

		if (!_opt.options.unminified) {
			css = new CleanCss({
				level         : 1,    // [clean-css v4] `1` is the default, but let's be specific
				compatibility : 'ie9' // [clean-css v4] 'ie10' is the default, so restore IE9 support
			}).minify(css).styles;
		}

		const fileSlug = _path.basename(filename, '.css').toLowerCase().replace(/[^0-9a-z]+/g, '-');

		return `<style id="style-${fileSlug}" type="text/css">${css}</style>`;
	});
}

function concatFiles(filenames, callback) {
	const output = filenames.map(filename => {
		const contents = readFile(filename);
		return typeof callback === 'function' ? callback(contents, filename) : contents;
	});
	return output.join('\n');
}

function assembleLibraries(libs) {
	console.log('Compacting libraries');

	if(_opt.options.remote){
		var s = '';
		libs.forEach(e => {
			s += '<script id="' + e.id  + '" src="' + e.remote + '"></script>' + '\n';
		});
		return s.trimRight();
	}else{
		var l = [];
		libs.forEach(e => {
			l.push(e.local);
		});
		return '<script id="script-libs" type="text/javascript">\n' + concatFiles(l, contents => contents.replace(/^\n+|\n+$/g, '')) + '\n</script>';
	}
}

function readFile(filename) {
	const filepath = _path.normalize(filename);

	try {
		// the replace() is necessary because Node.js only offers binary mode file
		// access, regardless of platform, so we convert DOS-style line terminators
		// to UNIX-style, just in case someone adds/edits a file and gets DOS-style
		// line termination all over it
		return _fs.readFileSync(filepath, { encoding : 'utf8' }).replace(/\r\n/g, '\n');
	}
	catch (ex) {
		die('cannot open file "${filepath}" for reading (reason: ${ex.message})');
	}
}

function writeFile(filename, data) {
	const filepath = _path.normalize(filename);

	try {
		_fs.writeFileSync(filepath, data, { encoding : 'utf8' });
	}
	catch (ex) {
		die(`cannot open file "${filepath}" for writing (reason: ${ex.message})`);
	}
}

function build(project){
    const file_src = project.src;
    const file_out = project.out;

    console.log('Writing file ' + file_out);

    let output = readFile(file_src); // load the story format template

    //Insert the different parts
    output = output.replace('{{BUILD_LIBS}}', project.lib);
    output = output.replace('{{BUILD_JS}}', () => project.js);
    output = output.replace('{{BUILD_CSS}}', project.css);
	output = output.replace('{{BUILD_VERSION}}', project.format.name + ' ' + project.format.version);

	//If testing, put the test data in the HTML file
	if( _opt.options.testing){
		console.log('Adding test data');
		output = output.replace('{{STORY_DATA}}', readFile('src/testing/test.html'));
	}
	
	//Output the files as separate if needed
	if (project.debug === true){
		console.log('Writing debug files');
		makePath(_path.dirname(CONFIG.debug.html));
		writeFile(CONFIG.debug.html, output);
		writeFile(CONFIG.debug.lib, project.lib);
		writeFile(CONFIG.debug.js, project.js);
		writeFile(CONFIG.debug.css, project.css);
		console.log('Debug files written');
	}

    //Post-process hook.
	if (typeof project.postProcess === 'function') {
		output = project.postProcess(output);
	}

	//Build the output path
	makePath(_path.dirname(file_out));
    //Write the outfile.
	writeFile(file_out, output);
}

function makePath(pathname) {
	const pathBits = _path.normalize(pathname).split(_path.sep);

	for (let i = 0; i < pathBits.length; ++i) {
		const dirPath = i === 0 ? pathBits[i] : pathBits.slice(0, i + 1).join(_path.sep);

		if (!_fs.existsSync(dirPath)) {
			_fs.mkdirSync(dirPath);
		}
	}
}