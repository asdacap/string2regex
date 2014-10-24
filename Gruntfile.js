/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/<%= pkg.name %>.js', '<%= html2js.main.dest %>'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    update_json: {
      bower: {
        src: 'package.json',
        dest: 'bower.json',
        fields: [
          'name',
          'version',
          'description',
          'repository'
        ]
      }
    },
    jshint: {
      options: {
        curly: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: false,
        boss: true,
        eqnull: true,
        browser: true,
        loopfunc: true,
        globals: {
          jQuery: true,
          _: true,
          angular: true,
          console: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['src/**/*.js', 'tests/**/*.js'],
        options: {
          expr: true
        }
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test','concat','uglify','mocha:dev']
      },
      less: {
        files: 'src/*.less',
        tasks: ['less']
      },
      html2js: {
        files: 'src/*.tpl.html',
        tasks: ['html2js','concat','uglify','mocha:all']
      }
    },
    mocha: {
      dev: {
        src: ['tests/dev.html'],
        options: {
          run: true
        }
      },
      all: {
        src: ['tests/**/*.html'],
        options: {
          run: true
        }
      },
    },
    bower: {
      install: {
        install: true,
      }
    },
    less: {
      string2regex: {
        files:{
          "dist/string2regex.css": "src/string2regex.less"
        }
      }
    },
    html2js: {
      options: {
        module: 'string2regex.template'
      },
      main: {
        src: ['src/**/*.tpl.html'],
        dest: 'tmp/templates.js'
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-update-json');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-html2js');

  // Default task.
  grunt.registerTask('default', ['bower','update_json','jshint','html2js','concat', 'less', 'uglify', 'mocha:all']);

};
