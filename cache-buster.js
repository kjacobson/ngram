const fs = require('fs');
const path = require('path');
const md5 = require('md5');

const STATIC_DIR = './static';
const BUILD_DIR = './build';
const MANIFEST_LOCATION = './static-file-manifest.json';

const staticFiles = require(MANIFEST_LOCATION);

const filePath = (filePath, dirPath, hash) => {
    if (hash) {
        const lastDot = filePath.lastIndexOf('.');
        const [path, extension] = [
            filePath.substring(0, lastDot), 
            filePath.substring(lastDot)
        ];
        filePath = path + '-' + hash + extension;
    }
    return path.resolve(dirPath, filePath);
};


const hashFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(md5(data));
            }
        });
    });
};

const processFile = (path) => {
    const oldHash = staticFiles[path];
    const staticPath = filePath(path, STATIC_DIR);

    return new Promise((resolve, reject) => {
        hashFile(staticPath).then((hash) => {
            if (oldHash !== hash) {
                staticFiles[path] = hash;
                replaceFile(oldHash, hash, path).then(resolve);
            } else {
                resolve();
                console.log("Nothing to change for file " + path);
            }
        }, (error) => {
            console.log("Error hashing file " + path);
            console.log(error);
        });
    });
};

const replaceFile = (oldHash, newHash, path) => {
    const sourceFilePath = filePath(path, STATIC_DIR);
    const newFilePath = filePath(path, BUILD_DIR, newHash);
    const oldFilePath = filePath(path, BUILD_DIR, oldHash);

    return new Promise((resolve, reject) => {
        fs.copyFile(sourceFilePath, newFilePath, (error) => {
            if (error) {
                console.log("Error renaming file " + path);
                resolve();
            } else {
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.log("Error removing old file " + oldFilePath, err);
                    }
                    resolve();
                })
            }
        });
    });
};

Promise.all(
    Object.keys(staticFiles).map(processFile)
).then(() => {
    try {
        const staticFilesJSON = JSON.stringify(staticFiles);
        fs.writeFile(MANIFEST_LOCATION, staticFilesJSON, (err) => {
            if (err) {
                console.log("Error writing to static file manifest");
            } else {
                console.log("Successfully hashed static files");
            }
        });
    }
    catch (err) {
        console.log("Error writing to file manifest due to un-stringifiable JSON", err);
    }
});
