var path = require('path');
var fs = require('fs');
var cp = require('child_process');

var targetDirectory = process.argv[2];
if (!targetDirectory) {
    console.error('No target directory provided.');
    process.exit(1)
}

var packageFile = path.resolve('./package.json');
if (!fs.existsSync(packageFile)) {
    console.error('package.json file doesn\'t exist on disk.')
    process.exit(1);
}

if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
}

var dest = path.join(targetDirectory, 'package.json');
console.log('Copying package.json to target location...');
fs.writeFileSync(dest, fs.readFileSync(packageFile));

if (fs.existsSync('npm-shrinkwrap.json')) {
    const shrinkWrapDest = path.join(targetDirectory, 'npm-shrinkwrap.json');
    shrinkwrapFile = path.resolve(shrinkwrapFile);
    console.log('Copying npm-shrinkwrap.json to target location...');
    fs.writeFileSync(shrinkWrapDest, fs.readFileSync(shrinkwrapFile));

}

console.log('Updating browser npm modules into target location...');
cp.execSync('npm update --production --prefix ' + targetDirectory);