const { execSync, exec } = require('child_process');
const gulp = require('gulp-param')(require('gulp'), process.argv);
const jsonfile = require('jsonfile');
const rm = require('rimraf');
const fse = require('fs-extra');
const fs = require('fs');

const config = {
  outputPath: './dist'
};

gulp.task('ng:create', function (name) {
  const stdout = execSync(`ng generate application ${name} --style=scss --skip-tests`);
  console.log(stdout.toString());

  cleanFeature(name);
});

gulp.task('ng:watch', function (name) {
  let timer;
  const child = exec(`ng build ${name} --watch`);
  child.stdout.on('data', (data) => {
    console.log(data);
    timer = timer || setTimeout(() => {
      cleanBuild(name);
      timer = null;
    }, 3000) ;
  });
  child.stderr.on('data', (data) => {
    console.log(data);
    process.exit(0);
  });
});

gulp.task('ng:build', function (name, prod) {
  if (name) {
    build(name, prod);
  } else {
    const angularJson = jsonfile.readFileSync(`./angular.json`);
    for (let project in angularJson.projects) {
      build(project, prod);
    }
  }
});

function build(name, prod) {
  let stdout;
  if (prod) {
    console.log(`Building ${name} in production mode...`);
    stdout = execSync(`ng build ${name} --prod`);
  }
  else {
    console.log(`Building ${name}...`);
    stdout = execSync(`ng build ${name}`);
  }
  console.log(stdout.toString());
  cleanBuild(name, prod);
}

function cleanBuild(name, prod) {
  console.log(`Cleaning build of ${name}...`);

  if (!prod) {
    moveIfExists(`${config.outputPath}/${name}/vendor.js.map`, `${config.outputPath}/vendor.js.map`, { overwrite: true });
    moveIfExists(`${config.outputPath}/${name}/polyfills.js.map`, `${config.outputPath}/polyfills.js.map`, { overwrite: true });
    moveIfExists(`${config.outputPath}/${name}/runtime.js.map`, `${config.outputPath}/runtime.js.map`, { overwrite: true });
    moveIfExists(`${config.outputPath}/${name}/styles.js.map`, `${config.outputPath}/styles.js.map`, { overwrite: true });
    moveIfExists(`${config.outputPath}/${name}/main.js.map`, `${config.outputPath}/${name}.js.map`, { overwrite: true });
  }
  moveIfExists(`${config.outputPath}/${name}/vendor.js`, `${config.outputPath}/vendor.js`, { overwrite: true });
  moveIfExists(`${config.outputPath}/${name}/polyfills.js`, `${config.outputPath}/polyfills.js`, { overwrite: true });
  moveIfExists(`${config.outputPath}/${name}/runtime.js`, `${config.outputPath}/runtime.js`, { overwrite: true });
  moveIfExists(`${config.outputPath}/${name}/styles.js`, `${config.outputPath}/styles.js`, { overwrite: true });
  moveIfExists(`${config.outputPath}/${name}/main.js`, `${config.outputPath}/${name}.js`, { overwrite: true });

  rm.sync(`${config.outputPath}/${name}`);
}

function cleanFeature (name) {
  console.log(`Cleaning source of ${name}...`);

  // Removing unused files
  rm.sync(`./features/${name}-e2e`);
  rm.sync(`./features/${name}/tsconfig.app.json`);
  rm.sync(`./features/${name}/tsconfig.spec.json`);
  rm.sync(`./features/${name}/tslint.json`);
  rm.sync(`./features/${name}/karma.conf.js`);
  rm.sync(`./features/${name}/browserslist`);

  // Moving src to root
  fse.moveSync(`./features/${name}/src/`, `./features/${name}`);

  // Removing unused source files
  rm.sync(`./features/${name}/src/`);
  rm.sync(`./features/${name}/assets`);
  rm.sync(`./features/${name}/environments`);
  rm.sync(`./features/${name}/favicon.ico`);
  rm.sync(`./features/${name}/polyfills.ts`);
  rm.sync(`./features/${name}/styles.scss`);
  // rimraf.sync(`./features/${name}/index.html`);
  rm.sync(`./features/${name}/test.ts`);

  // Editing angular.json paths
  const angularJson = jsonfile.readFileSync(`./angular.json`);
  angularJson.projects[name].sourceRoot = `features/${name}`;
  angularJson.projects[name].architect.build.options.index = `features/${name}/index.html`;
  angularJson.projects[name].architect.build.options.main = `features/${name}/main.ts`;
  angularJson.projects[name].architect.build.options.polyfills = `features/polyfills.ts`;
  angularJson.projects[name].architect.build.options.tsConfig = 'tsconfig.json';
  angularJson.projects[name].architect.build.options.assets = [];
  angularJson.projects[name].architect.build.options.styles = [ `features/styles.scss` ];
  angularJson.projects[name].architect.build.options.outputPath = `${config.outputPath}/${name}`;
  angularJson.projects[name].architect.build.configurations.production.fileReplacements = [];
  delete angularJson.projects[name].architect.build.configurations.production.vendorChunk;
  delete angularJson.projects[name].architect.build.configurations.production.outputHashing;
  delete angularJson.projects[name].architect.build.configurations.production.extractCss;
  angularJson.projects[name].architect.lint.options.tsConfig = [ 'tsconfig.json' ];
  delete angularJson.projects[name].architect.serve;
  delete angularJson.projects[name].architect.test;
  delete angularJson.projects[name].architect['extract-i18n'];
  delete angularJson.projects[name + '-e2e'];

  // Saving to angular.json
  jsonfile.writeFileSync(`./angular.json`, angularJson, { spaces: 2 });

  const mainTs = `
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`;

  fs.writeFileSync(`./features/${name}/main.ts`, mainTs);
}

function moveIfExists(from, to, opts) {
  if (fs.existsSync(from)) fse.moveSync(from, to, opts);
}
