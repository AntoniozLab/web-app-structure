var gulp = require('gulp'), //Gulp
	notify = require("gulp-notify"), //Notificar en el computador, se necesita tener instalado growl -> http://growl.info/thirdpartyinstallations
	jade = require('gulp-jade'), //Compilar Jade
	prefix = require('gulp-autoprefixer'), //Autoprefixer de CSS
	stylus = require('gulp-stylus'), //Compilar stylus
	changed = require('gulp-changed'), //Verificar si el archivo ha cambiando para aplicarle o no un pipe
	image = require('gulp-image'), //Optimización de imágenes jpg,png,gif
	imagemin = require('gulp-tinypng'),//Mejor optimización de imágenes png, se necesita de un token. Para más info visitar -> https://tinypng.com
	watch = require('gulp-watch'), //Ver cambios en los archivos en tiempo real
	uglify = require('gulp-uglify'), //Optimizar archivos javascript minificando
	plumber = require('gulp-plumber'), //Seguir ejecutando los pipe de gulp aunque exista un error
	connect = require('gulp-connect'), //Servidor node con livereload
	concat = require('gulp-concat'), //Concatenar
	stripDebug = require('gulp-strip-debug'), //Eliminar comentarios y comandos como console.log
	argv = require('yargs').argv; //Permite pasar argumentos vía consola del sistema


/*  ==========================================================================
    Rutas de desarrollo y producción
    ========================================================================== */
var devPath = './app/';
var prodPath = './public/';


/*  ==========================================================================
    Servidor con livereload
    ========================================================================== */
gulp.task('connect', function () {
	var path = (argv.production) ? prodPath : devPath;
	connect.server({
		root: 'app',
		livereload: true
	});
});


/*  ==========================================================================
    Archivos HTML
    ========================================================================== */
gulp.task('html', function(){
	if(argv.production){
	//Producción
		
		gulp.src('./jade/*.jade')
			.pipe(plumber())
			.pipe(jade())
			.pipe(gulp.dest(prodPath))
			.pipe(notify("HTML Producción: <%= file.relative %>!"));
		
	}else{
	//Desarrollo

		gulp.src('./jade/*.jade')
			.pipe(plumber())
			.pipe(watch({  emit:'one' }))
			.pipe(jade({
				pretty: true
			}))
			.pipe(gulp.dest(devPath))
			.pipe(connect.reload())
			.pipe(notify("HTML Dev: <%= file.relative %>!"));
	}
});


/*  ==========================================================================
    Archivos CSS
    ========================================================================== */
gulp.task('css', function(){
	if(argv.production){
	//Producción
	
		gulp.src('./stylus/*.min.styl')
			.pipe(plumber({
				errorHandler: notify.onError("Error: <%= error.message %>")
			}))
			.pipe(stylus({compress: true}))
			.pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
			.pipe(gulp.dest(prodPath + 'css'))
			.pipe(notify("CSS Prod: <%= file.relative %>!"));
		
	}else{
	//Desarrollo

		watch({glob: './stylus/*.styl'}, function(end){
			gulp.src('./stylus/*.min.styl')
				.pipe(plumber({
					errorHandler: notify.onError("Error: <%= error.message %>")
				}))
				.pipe(stylus())
				.pipe(prefix("last 1 version", "> 1%", "ie 8", "ie 7"))
				.pipe(gulp.dest(devPath + 'css'))
				.pipe(notify("CSS Dev: <%= file.relative %>!"))
				.pipe(connect.reload());
		});
	}	
});


/*  ==========================================================================
    Archivos Javascript
    ========================================================================== */
gulp.task('js', function () {
	
	//Copiar los archivos vendor de la carpeta de desarrollo a producción
	gulp.src(devPath + 'js/vendor/html5-3.6-respond-1.1.0.min.js')
		.pipe(changed(path))
		.pipe(stripDebug())
		.pipe(gulp.dest(prodPath + 'js'));

	// Archivos a concatenar para la página del home
	var filesHome = [
		'./bower_components/jquery/dist/jquery.js',
		'./app/js/home.js'
	];

	if(argv.production){
	//Producción
	
		//Página Home
		/**
		 * Descripción del proceso:
		 * 1. Se concatena todos los archivos necesarios para el home y se le asgina el nombre home.min.js
		 * 3. Se minificado el archivo concatenado y se le quita comentarios y comandos de debug
		 * 4. Se guarda el archivo en la carpeta de destino
		 */
		gulp.src(filesHome)
			.pipe(concat('home.min.js'))
			.pipe(uglify())
			.pipe(stripDebug())
			//.pipe(uglify().on('error', function(e) { console.log('\x07',e.message); return this.end(); })) //--> Muestra un mensaje más completo del error
			.pipe(gulp.dest(prodPath + 'js'));
			
				
	}else{
	//Desarrollo

		//Página Home
		/**
		 * Descripción del proceso:
		 * 1. Se oberva cada vez que haya un cambio en el archivo home.js
		 * 2. Se concatena todos los archivos necesarios para el home y se le asgina el nombre home.min.js
		 * 3. Se guarda el archivo concatenado en la carpeta destino.
		 * 4. Se recarga el servidor automáticamente.
		 */
		gulp.src(['./app/js/home.js'])
			.pipe(watch({ emit: 'all' }, function(){
				gulp.src(filesHome)
					.pipe(concat('menu.min.js'))
					.pipe(gulp.dest(devPath + 'js'))
					.pipe(connect.reload());	
			}));
	};

});


/*  ==========================================================================
    Fuentes
    ========================================================================== */
gulp.task('fonts', function(){
	gulp.src('./app/fonts/**/*')
		.pipe(changed(path))
		.pipe(image())
		.pipe(gulp.dest(prodPath + 'fonts'));
});

/*  ==========================================================================
    Archivos JPG
    ========================================================================== */
gulp.task('jpg', function(){
	gulp.src('./app/img/*.jpg')
		.pipe(changed(path))
		.pipe(image())
		.pipe(gulp.dest(prodPath + 'img'));
});

/*  ==========================================================================
    Archivos PNG
    ========================================================================== */
gulp.task('png', function(){
	gulp.src('./app/img/*.png')
		.pipe(changed(path))
		.pipe(imagemin("CHD9zVb-3FcqW3C0kzIX_fR3L-UArybO"))
		.pipe(gulp.dest(prodPath + 'img'));
});



/*  ==========================================================================
    Archivos Extra: Puedes usar este como base para crear el tuyo propio
    ========================================================================== */

gulp.task('nombre-del-task', function(){

	//Tipo de archivos a procesar
	gulp.src('./app/carpeta/**/*')
		.pipe(changed(path))
		.pipe(gulp.dest(prodPath + 'carpeta'));
});

//Tareas para Desarrollo
gulp.task('default', function(){
	
	gulp.start('connect');
	gulp.start('html');
	gulp.start('js');
	gulp.start('css');
	
	//Estos procesos se ejcutan sólo si en consola se pasa al final el argumento --production
	if(argv.production){
		gulp.start('fonts');	
		gulp.start('images');	
		gulp.start('png');	
	};

});




