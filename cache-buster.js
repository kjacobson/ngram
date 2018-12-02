const fs = require('fs');
const path = require('path');
const readline = require('readline');
const md5 = require('md5');
const mkdirp = require('mkdirp');

const STATIC_DIR = './static';
const BUILD_DIR = './build';
const MANIFEST_LOCATION = './static-file-manifest.json';

const QUOTE_REGEX = "([\"'])";
const BUILD_DIR_REGEX = "\.\/build\/";
const PATH_CHARS_REGEX = "([a-zA-Z0-9\-\_\.\/]+)";
const MD5_REGEX = "(?:\\+[a-f0-9]{32})?";
const FILE_EXTENSION_REGEX = "(\.(?:js|gif|jpeg|jpg|html|webmanifest|json|png|svg))";
const STATIC_LINK_REGEX = new RegExp(QUOTE_REGEX + BUILD_DIR_REGEX + PATH_CHARS_REGEX + MD5_REGEX + FILE_EXTENSION_REGEX + QUOTE_REGEX, 'g');

const SW_CACHE_NAME_REGEX = new RegExp("(CACHE_NAME *= *)" + QUOTE_REGEX + "(topwords\-cache)" + QUOTE_REGEX, 'g');

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
                        console.info("Created director " + loc + ", which did not previously exist");
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
        const lastDot = filePath.lastIndexOf('.');
        const [loc, extension] = lastDot > -1 ? [
            filePath.substring(0, lastDot), 
            filePath.substring(lastDot)
        ] : [filePath, ''];
        filePath = loc + '+' + hash + extension;
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
        hashFile(staticPath).then((hash) => {
            if (oldHash !== hash) {
                staticFiles[loc] = hash;
                replaceFile(oldHash, hash, loc).then(resolve);
            } else {
                const oldFilePath = filePath(loc, BUILD_DIR, oldHash);
                if (fs.existsSync(oldFilePath)) {
                    console.info("Nothing changed in file " + loc);
                    resolve();
                } else {
                    replaceFile(oldHash, hash, loc).then(resolve);
                }
            }
        }, (error) => {
            console.error("Error hashing file " + loc);
            console.error(error);
        });
    });
};

const copyFile = (sourceFilePath, newFilePath) => {
    return new Promise((resolve, reject) => {
        fs.copyFile(sourceFilePath, newFilePath, (error) => {
            if (error) {
                console.warn("Error renaming file " + loc);
                reject();
            } else {
                console.log("Changed file " + sourceFilePath + " successfully renamed as " + newFilePath);
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
        if (lastSlash > -1) {
            const newFileDir = newFilePath.substring(0, lastSlash);
            ensureDirectory(newFileDir).then(() => {
                copyFile(sourceFilePath, newFilePath).then(resolve);
            });
        } else {
            copyFile.then(() => {
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.warn("Error removing old file " + oldFilePath, err);
                        resolve();
                    }
                    resolve();
                })
            }, () => { /* no-op */});
        }
    });
};

const rewriteLinks = (file) => {
    file = file.replace(SW_CACHE_NAME_REGEX, (match, declaration, openQuote, prefix, closeQuote) => {
        let hash = staticFiles['./sw.js'];
        return hash ? `${declaration}${openQuote}${prefix}+${hash}${closeQuote}` : match;
    });
    return file.replace(STATIC_LINK_REGEX, (match, openQuote, preHashPath, fileExtension, closeQuote) => {
        let hash = staticFiles['./' + preHashPath + fileExtension];
        return hash ?
            `${openQuote}${BUILD_DIR}/${preHashPath}+${hash}${fileExtension}${closeQuote}` : match;
    }); 
};

const rewriteAssetLinksForFile = (loc) => {
    const fileHash = staticFiles[loc];
    const urlPartsRegex = new RegExp('\.?\/?' + PATH_CHARS_REGEX + FILE_EXTENSION_REGEX);
    if (fileHash) {
        loc = loc.replace(urlPartsRegex, '$1+' + fileHash + '$2');
        loc = path.resolve(BUILD_DIR, loc);
    }
    fs.readFile(loc, 'utf8', (err, data) => {
        if (err) {
            console.error("Error opening " + loc + " to rewrite links:", err);
        } else {
            const fileData = rewriteLinks(data);
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

Promise.all(
    Object.keys(staticFiles).map(processFile)
).then(() => {
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
                console.info("Successfully hashed static files");
                rewriteConsumerFiles();
            }
        });
    }
    catch (err) {
        console.error("Error writing to file manifest due to un-stringifiable JSON", err);
    }
});
