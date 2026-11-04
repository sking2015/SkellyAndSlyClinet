// node tests/check-client-types.cjs [path/to/typescript.js]
const ts = require(process.argv[2] || 'typescript');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
// Validate the game against the installed Cocos declarations, excluding editor extensions.
parsed.options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
parsed.options.skipLibCheck = true;
const files = parsed.fileNames.filter(file => file.replaceAll('\\', '/').includes('/assets/'));
const errors = ts.getPreEmitDiagnostics(ts.createProgram(files, parsed.options));
for (const error of errors) {
    console.error(ts.flattenDiagnosticMessageText(error.messageText, '\n')
        + (error.file ? ' @ ' + error.file.fileName : ''));
}
console.log('Client typecheck:', files.length, 'files,', errors.length, 'errors');
process.exitCode = errors.length ? 1 : 0;
