const fs = require('fs');
const path = require('path');
const readline = require('readline');
const md5 = require('md5');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const STATIC_DIR = './static';
const BUILD_DIR = './public';
const MANIFEST_LOCATION = './static-file-manifest.json';

const QUOTE_REGEX = "([\"'])";
const BUILD_DIR_REGEX = "(?:\.?\.?\/?public\/)";
const PATH_CHARS_REGEX = "([a-zA-Z0-9\-\_\/]+)";
const MD5_REGEX = "(?:\\+[a-f0-9]{32})?";
const FILE_EXTENSION_REGEX = "((?:\.(?:js|gif|jpeg|jpg|html|webmanifest|json|png|svg|map))+)";
const STATIC_LINK_REGEX = new RegExp(QUOTE_REGEX + BUILD_DIR_REGEX + PATH_CHARS_REGEX + MD5_REGEX + FILE_EXTENSION_REGEX + QUOTE_REGEX, 'g');

const SW_CACHE_NAME_REGEX = new RegExp("(CACHE_NAME *= *)" + QUOTE_REGEX + "(topwords\-cache)" + QUOTE_REGEX, 'g');
const SW_FILE_NAME_REGEX = new RegExp("sw\![a-f0-9]{32}\.js");
const SOURCE_MAP_REGEX = new RegExp(BUILD_DIR_REGEX + "(browser)(\.js\.map)");

const staticFileManifest = require(MANIFEST_LOCATION);
const staticFiles = staticFileManifest.assets;
const staticFileConsumers = staticFileManifest.consumers;

const ensureDirectory = (loc) => {
    return new Promise((resolve, reject) => {
        fs.stat(loc, (err, stat) => {
            if (err && err.code === 'ENOENT') {
                mkdirp(loc, (err) => {
                    if (err) {
                        console.error("Directory " + loc + " does not exist and could not be created");
                        reject(err);
                    } else {
                        console.info("Created directory " + loc + ", which did not previously exist");
                        resolve();
                    }
                });
            } else
            if (stat && stat.isDirectory()) {
                resolve();
            }
        });
    });
};

const filePath = (filePath, dirPath, hash) => {
    if (hash) {
        const lastDot = new RegExp(FILE_EXTENSION_REGEX, 'g').exec(filePath).index;
        const [loc, extension] = lastDot > -1 ? [
            filePath.substring(0, lastDot), 
            filePath.substring(lastDot)
        ] : [filePath, ''];
        filePath = loc + '!' + hash + extension;
    }
    return path.resolve(dirPath, filePath);
};


const hashFile = (loc) => {
    return new Promise((resolve, reject) => {
        fs.readFile(loc, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(md5(data));
            }
        });
    });
};

const processFile = (loc) => {
    const oldHash = staticFiles[loc];
    const staticPath = filePath(loc, STATIC_DIR);

    return new Promise((resolve, reject) => {
        if (loc === "./sw.js") {
            return resolve()
        }
        hashFile(staticPath).then((hash) => {
            if (oldHash !== hash) {
                staticFiles[loc] = hash;
            } else {
                console.info("Nothing changed in file " + loc);
            }
            replaceFile(oldHash, hash, loc).then(resolve);
        }, (error) => {
            console.error("Error hashing file " + loc);
            console.error(error);
        });
    });
};

const processServiceWorker = () => {
    const fileName = './sw.js';
    const staticPath = filePath(fileName, STATIC_DIR);

    return new Promise((resolve, reject) => {
        fs.readFile(staticPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error opening " + staticPath + " to rewrite links:", err);
                resolve();
            } else {
                let newFileData = rewriteLinks(data);
                hash = md5(Math.random());
                newFileData = newFileData.replace(SW_CACHE_NAME_REGEX, (match, declaration, openQuote, prefix, closeQuote) => {
                    return `${declaration}${openQuote}${prefix}+${hash}${closeQuote}`;
                });
                newFileData = newFileData.replace(SW_FILE_NAME_REGEX, `sw!${hash}.js`);
                staticFiles[fileName] = hash;

                const newPath = filePath(fileName, BUILD_DIR, hash);
                fs.writeFile(newPath, newFileData, 'utf8', (err) => {
                    if (err) {
                        console.error("Error writing modified static links to file " + newPath);
                        resolve();
                    } else {
                        console.log("Successfully rewrote links in file " + newPath);
                        resolve();
                    }
                });
            }
        });
    });
}

const copyFile = (sourceFilePath, newFilePath) => {
    return new Promise((resolve, reject) => {
        fs.copyFile(sourceFilePath, newFilePath, (error) => {
            if (error) {
                console.warn("Error renaming file " + loc);
                reject();
            } else {
                console.log("File " + sourceFilePath + " successfully copied to " + newFilePath);
                resolve();
            }
        });
    });
};

const replaceFile = (oldHash, newHash, loc) => {
    const sourceFilePath = filePath(loc, STATIC_DIR);
    const newFilePath = filePath(loc, BUILD_DIR, newHash);
    const oldFilePath = filePath(loc, BUILD_DIR, oldHash);

    const lastSlash = newFilePath.lastIndexOf('/');

    return new Promise((resolve, reject) => {
        const newFileDir = newFilePath.substring(0, lastSlash);
        ensureDirectory(newFileDir).then(() => {
            copyFile(sourceFilePath, newFilePath).then(resolve);
        });
    });
};

const rewriteLinks = (file) => {
    file = file.replace(SOURCE_MAP_REGEX, (match, fileName, extension) => {
        let hash = staticFiles['./' + match];
        return hash ? `./${fileName}!${hash}${extension}` : match;
    });

    return file.replace(STATIC_LINK_REGEX, (match, openQuote, preHashPath, fileExtension, closeQuote) => {
        let hash = staticFiles['./' + preHashPath + fileExtension];
        return hash ?
            `${openQuote}./${preHashPath}!${hash}${fileExtension}${closeQuote}` : match;
    }); 
};

const rewriteAssetLinksForFile = (loc) => {
    const fileHash = staticFiles[loc];
    const urlPartsRegex = new RegExp('\.?\/?' + PATH_CHARS_REGEX + FILE_EXTENSION_REGEX);
    if (fileHash) {
        loc = loc.replace(urlPartsRegex, '$1!' + fileHash + '$2');
        loc = path.resolve(BUILD_DIR, loc);
    }
    fs.readFile(loc, 'utf8', (err, data) => {
        if (err) {
            console.error("Error opening " + loc + " to rewrite links:", err);
        } else {
            const fileData = rewriteLinks(data);
            if (loc === './index.html') {
                loc = './public/index.html';
            }
            fs.writeFile(loc, fileData, 'utf8', (err) => {
                if (err) {
                    console.error("Error writing modified static links to file " + loc);
                } else {
                    console.log("Successfully rewrote links in file " + loc);
                }
            });
        }
    });
};

const rewriteConsumerFiles = () => {
    staticFileConsumers.forEach(rewriteAssetLinksForFile);
};

rimraf('./public/*', (err) => {
    if (err) {
        console.log("Could not clear build directory");
    } else {
        Promise.all(
            Object.keys(staticFiles).map(processFile)
        ).then(() => {
            processServiceWorker().then(() => {
                try {
                    const staticFilesJSON = JSON.stringify(
                        Object.assign(staticFileManifest, { assets: staticFiles}),
                        null,
                        4
                    );
                    fs.writeFile(MANIFEST_LOCATION, staticFilesJSON, (err) => {
                        if (err) {
                            console.error("Error writing to static file manifest");
                        } else {
                            rewriteConsumerFiles();
                            console.info("Successfully hashed static files");
                        }
                    });
                }
                catch (err) {
                    console.error("Error writing to file manifest due to un-stringifiable JSON", err);
                }
            });
        });
    }
});
