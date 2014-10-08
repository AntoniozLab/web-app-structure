'use strict';

var gulp = require('gulp'); //Gulp
var notify = require('gulp-notify'); //Notificar en el computador
var jade = require('gulp-jade'); //Compilar Jade
var prefix = require('gulp-autoprefixer'); //Autoprefixer de CSS
var stylus = require('gulp-stylus'); //Compilar stylus
var changed = require('gulp-changed'); //Verificar si el archivo ha cambiando para aplicarle o no un pipe
var image = require('gulp-image'); //Optimiza imágenes PNG, JPEG, GIF y SVG, pero no lo usaremos para archivos PNG, a cambio usaremos tinypng
var imagemin = require('gulp-tinypng');//Optimiza archivos PNG con mayor eficiencia, pero se necesita de un token. Para más info visitar -> https://tinypng.com
var watch = require('gulp-watch'); //Mira cambios en los archivos que uno indique y lanza una acción, por ejemplo recargar el navegador.
var uglify = require('gulp-uglify'); //Optimizar archivos javascript
var plumber = require('gulp-plumber'); //Seguir ejecutando los pipe de gulp aunque exista un error
var connect = require('gulp-connect'); //Servidor node con livereload
var concat = require('gulp-concat'); //Concatenar
var stripDebug = require('gulp-strip-debug'); //Eliminar comentarios y comandos como console.log
var size = require('gulp-size');
var argv = require('yargs').argv; //Permite pasar argumentos vía consola del sistema

/* ===========================================================================
RUTAS DE DESARROLLO Y PRODUCCIÓN
=========================================================================== */
var devPath = './app/frontend/';
var prodPath = './public/frontend/';

/* ===========================================================================
SERVIDOR DE DESARROLLO
=========================================================================== */
gulp.task('server-dev', function() {
  connect.server({
    root: 'app/frontend/',
    livereload: true
  });
});

/* ===========================================================================
SERVIDOR DE PRODUCCIÓN
=========================================================================== */
gulp.task('server-prod', function () {
	connect.server({
		root: 'public/frontend/'
	});
});

/* ===========================================================================
HTML
=========================================================================== */
gulp.task('html', function(){

	if(argv.production){
	//Producción

		gulp.src('./jade/*.jade')
			.pipe(plumber())
			.pipe(jade())
      .pipe(size({title: 'HTML Optimizados:'}))
			.pipe(gulp.dest(prodPath))
			.pipe(notify('HTML Producción: <%= file.relative %>!'));

	}else{
	//Desarrollo

		gulp.src('./jade/*.jade')
			.pipe(plumber())
			.pipe(watch({ emit:'one' }))
			.pipe(jade({ pretty: true }))
			.pipe(gulp.dest(devPath))
			.pipe(connect.reload())
			.pipe(notify('HTML Desarrollo: <%= file.relative %>!'));

		gulp.src('./jade/includes/*.jade')
			.pipe(watch({ emit:'one' }, function(){

				gulp.src('./jade/*.jade')
					.pipe(plumber())
					.pipe(jade({ pretty: true }))
					.pipe(gulp.dest(devPath))
					.pipe(connect.reload())
					.pipe(notify('HTML Desarrollo by Jade Includes: <%= file.relative %>!'));

			}));
	}

});

/* ===========================================================================
CSS
=========================================================================== */
gulp.task('css', function(){
	var destPath;

	if(argv.production){
	//Producción

		destPath = prodPath + 'css/';
		gulp.src('./stylus/*.min.styl')
			.pipe(plumber({
				errorHandler: notify.onError('Error: <%= error.message %>')
			}))
			.pipe(stylus({compress: true}))
			.pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
      .pipe(size({title: 'CSS Optimizados:'}))
			.pipe(gulp.dest(destPath))
			.pipe(notify('CSS Producción: <%= file.relative %>!'));

	}else{
	//Desarrollo

		destPath = devPath + 'css/';
		watch({glob: './stylus/*.styl'}, function(){
			gulp.src('./stylus/*.min.styl')
				.pipe(plumber({
					errorHandler: notify.onError('Error: <%= error.message %>')
				}))
				.pipe(stylus())
				.pipe(prefix('last 1 version', '> 1%', 'ie 8', 'ie 7'))
				.pipe(gulp.dest(destPath))
				.pipe(connect.reload())
				.pipe(notify('CSS Desarrollo: <%= file.relative %>!'));
		});
	}
});

/* ===========================================================================
JAVASCRIPT
=========================================================================== */
gulp.task('js', function () {
	var destPath;

	// Archivos a concatenar para la página del home
	var filesHome = [
		'./bower_components/jquery/dist/jquery.js',
		'./app/frontend/js/home.js'
	];

	if(argv.production){
	//Producción
	destPath = prodPath + 'js/';

		//Copia html5shiv.js y respond.js a producción
		gulp.src(devPath + 'js/vendor/html5-3.6-respond-1.1.0.min.js')
			.pipe(changed(destPath + 'vendor/'))
			.pipe(stripDebug())
			.pipe(gulp.dest(destPath + 'vendor/'))
			.pipe(notify('Html5shiv.js & Respond.js Producción: <%= file.relative %>!'));

		//Página Home
		gulp.src(filesHome)
			.pipe(concat('home.min.js'))
			.pipe(uglify())
			//.pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); })) //--> Muestra un mensaje más completo del error
			.pipe(stripDebug())
      .pipe(size({title: 'JS Optimizados:'}))
			.pipe(gulp.dest(destPath))
			.pipe(notify('JS Producción: <%= file.relative %>!'));

	}else{
	//Desarrollo
	destPath = devPath + 'js/';

		//Página Home
		gulp.src(['./app/frontend/js/home.js'])
			.pipe(watch({ emit: 'all' }, function(){
				gulp.src(filesHome)
					.pipe(concat('home.min.js'))
					.pipe(gulp.dest(destPath))
					.pipe(connect.reload())
					.pipe(notify('JS Desarrollo: <%= file.relative %>!'));
			}));
	}

});

/* ===========================================================================
IMAGÉNES EXCEPTO ARCHIVOS PNG
=========================================================================== */
gulp.task('images', function(){
	var destPath = prodPath + 'img/';
	gulp.src([devPath+'img/*', '!'+devPath+'img/*.png'])
		.pipe(changed(destPath))
		.pipe(image({
      progressive: true,
      interlaced: true
    }))
    .pipe(size({title: 'JPG Optimizados:'}))
		.pipe(gulp.dest(destPath));
});

/* ===========================================================================
IMÁGENES PNG
=========================================================================== */
gulp.task('png', function(){

	//Path destino
	var destPath = prodPath + 'img/';

	gulp.src(devPath + 'img/*.png')
		.pipe(changed(destPath))
		.pipe(imagemin('CHD9zVb-3FcqW3C0kzIX_fR3L-UArybO'))
    .pipe(size({title: 'PNG Optimizados:'}))
		.pipe(gulp.dest(destPath));
});

/* ===========================================================================
COPIAR ARCHIVOS
=========================================================================== */
gulp.task('copy', function(){
	var destPath = prodPath + 'fonts/';
	//FUENTES
	gulp.src(devPath + 'fonts/**/*')
		.pipe(changed(destPath))
		.pipe(gulp.dest(destPath));

	//PDF
	//VIDEOS
	//MP3
	//OTROS
});

/* ===========================================================================
TASK DE EJEMPLO PARA QUE CREES EL TUYO :D
=========================================================================== */
gulp.task('nombre-del-task', function(){
	var destPath = prodPath + 'carpeta/';

	//Indicar que tipo de archivos vamos a pasar por los pipe
	gulp.src('./app/carpeta/**/*')
		.pipe(changed(destPath))
		.pipe(gulp.dest(destPath));
});

/* ===========================================================================
TAREAS POR DEFECTO
=========================================================================== */
gulp.task('default', function(){

	gulp.start('html');
	gulp.start('js');
	gulp.start('css');

	if(!argv.production){
		gulp.start('server-dev');

	}else{
		gulp.start('server-prod');
		gulp.start('copy');
		gulp.start('images');
		gulp.start('png');
	}

});
