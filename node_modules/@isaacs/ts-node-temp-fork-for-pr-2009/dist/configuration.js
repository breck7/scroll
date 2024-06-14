"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTsConfigDefaults = exports.ComputeAsCommonRootOfFiles = exports.loadCompiler = exports.resolveAndLoadCompiler = exports.readConfig = exports.findAndReadConfig = void 0;
const path_1 = require("path");
const index_1 = require("./index");
const ts_internals_1 = require("./ts-internals");
const tsconfigs_1 = require("./tsconfigs");
const util_1 = require("./util");
/**
 * TypeScript compiler option values required by `ts-node` which cannot be overridden.
 */
const TS_NODE_COMPILER_OPTIONS = {
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
    declaration: false,
    noEmit: false,
    outDir: '.ts-node',
};
/*
 * Do post-processing on config options to support `ts-node`.
 */
function fixConfig(ts, config) {
    // Delete options that *should not* be passed through.
    delete config.options.out;
    delete config.options.outFile;
    delete config.options.composite;
    delete config.options.declarationDir;
    delete config.options.declarationMap;
    delete config.options.emitDeclarationOnly;
    // Target ES5 output by default (instead of ES3).
    if (config.options.target === undefined) {
        config.options.target = ts.ScriptTarget.ES5;
    }
    // Target CommonJS modules by default (instead of magically switching to ES6 when the target is ES6).
    if (config.options.module === undefined) {
        config.options.module = ts.ModuleKind.CommonJS;
    }
    return config;
}
/** @internal */
function findAndReadConfig(rawOptions) {
    const cwd = (0, path_1.resolve)(rawOptions.cwd ?? rawOptions.dir ?? index_1.DEFAULTS.cwd ?? process.cwd());
    const compilerName = rawOptions.compiler ?? index_1.DEFAULTS.compiler;
    // Compute minimum options to read the config file.
    let projectLocalResolveDir = (0, util_1.getBasePathForProjectLocalDependencyResolution)(undefined, rawOptions.projectSearchDir, rawOptions.project, cwd);
    let { compiler, ts } = resolveAndLoadCompiler(compilerName, projectLocalResolveDir);
    // Read config file and merge new options between env and CLI options.
    const { configFilePath, config, tsNodeOptionsFromTsconfig, optionBasePaths } = readConfig(cwd, ts, rawOptions);
    const options = (0, util_1.assign)({}, index_1.DEFAULTS, tsNodeOptionsFromTsconfig || {}, { optionBasePaths }, rawOptions);
    options.require = [...(tsNodeOptionsFromTsconfig.require || []), ...(rawOptions.require || [])];
    // Re-resolve the compiler in case it has changed.
    // Compiler is loaded relative to tsconfig.json, so tsconfig discovery may cause us to load a
    // different compiler than we did above, even if the name has not changed.
    if (configFilePath) {
        projectLocalResolveDir = (0, util_1.getBasePathForProjectLocalDependencyResolution)(configFilePath, rawOptions.projectSearchDir, rawOptions.project, cwd);
        ({ compiler } = resolveCompiler(options.compiler, optionBasePaths.compiler ?? projectLocalResolveDir));
    }
    return {
        options,
        config,
        projectLocalResolveDir,
        optionBasePaths,
        configFilePath,
        cwd,
        compiler,
    };
}
exports.findAndReadConfig = findAndReadConfig;
/**
 * Load TypeScript configuration. Returns the parsed TypeScript config and
 * any `ts-node` options specified in the config file.
 *
 * Even when a tsconfig.json is not loaded, this function still handles merging
 * compilerOptions from various sources: API, environment variables, etc.
 *
 * @internal
 */
function readConfig(cwd, ts, rawApiOptions) {
    // Ordered [a, b, c] where config a extends b extends c
    const configChain = [];
    let config = { compilerOptions: {} };
    let basePath = cwd;
    let rootConfigPath = undefined;
    const projectSearchDir = (0, path_1.resolve)(cwd, rawApiOptions.projectSearchDir ?? cwd);
    const { fileExists = ts.sys.fileExists, readFile = ts.sys.readFile, skipProject = index_1.DEFAULTS.skipProject, project = index_1.DEFAULTS.project, tsTrace = index_1.DEFAULTS.tsTrace, } = rawApiOptions;
    // Read project configuration when available.
    if (!skipProject) {
        if (project) {
            const resolved = (0, path_1.resolve)(cwd, project);
            const nested = (0, path_1.join)(resolved, 'tsconfig.json');
            rootConfigPath = fileExists(nested) ? nested : resolved;
        }
        else {
            rootConfigPath = ts.findConfigFile(projectSearchDir, fileExists);
        }
        if (rootConfigPath) {
            // If root extends [a, c] and a extends b, c extends d, then this array will look like:
            // [root, c, d, a, b]
            let configPaths = [rootConfigPath];
            const tsInternals = (0, ts_internals_1.createTsInternals)(ts);
            const errors = [];
            // Follow chain of "extends"
            for (let configPathIndex = 0; configPathIndex < configPaths.length; configPathIndex++) {
                const configPath = configPaths[configPathIndex];
                const result = ts.readConfigFile(configPath, readFile);
                // Return diagnostics.
                if (result.error) {
                    return {
                        configFilePath: rootConfigPath,
                        config: { errors: [result.error], fileNames: [], options: {} },
                        tsNodeOptionsFromTsconfig: {},
                        optionBasePaths: {},
                    };
                }
                const c = result.config;
                const bp = (0, path_1.dirname)(configPath);
                configChain.push({
                    config: c,
                    basePath: bp,
                    configPath: configPath,
                });
                if (c.extends == null)
                    continue;
                const extendsArray = Array.isArray(c.extends) ? c.extends : [c.extends];
                for (const e of extendsArray) {
                    const resolvedExtendedConfigPath = tsInternals.getExtendsConfigPath(e, {
                        fileExists,
                        readDirectory: ts.sys.readDirectory,
                        readFile,
                        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
                        trace: tsTrace,
                    }, bp, errors, ts.createCompilerDiagnostic);
                    if (errors.length) {
                        return {
                            configFilePath: rootConfigPath,
                            config: { errors, fileNames: [], options: {} },
                            tsNodeOptionsFromTsconfig: {},
                            optionBasePaths: {},
                        };
                    }
                    if (resolvedExtendedConfigPath != null) {
                        // Tricky! If "extends" array is [a, c] then this will splice them into this order:
                        // [root, c, a]
                        // This is what we want.
                        configPaths.splice(configPathIndex + 1, 0, resolvedExtendedConfigPath);
                    }
                }
            }
            ({ config, basePath } = configChain[0]);
        }
    }
    // Merge and fix ts-node options that come from tsconfig.json(s)
    const tsNodeOptionsFromTsconfig = {};
    const optionBasePaths = {};
    for (let i = configChain.length - 1; i >= 0; i--) {
        const { config, basePath, configPath } = configChain[i];
        const options = filterRecognizedTsConfigTsNodeOptions(config['ts-node']).recognized;
        // Some options are relative to the config file, so must be converted to absolute paths here
        if (options.require) {
            // Modules are found relative to the tsconfig file, not the `dir` option
            const tsconfigRelativeResolver = (0, util_1.createProjectLocalResolveHelper)((0, path_1.dirname)(configPath));
            options.require = options.require.map((path) => tsconfigRelativeResolver(path, false));
        }
        if (options.scopeDir) {
            options.scopeDir = (0, path_1.resolve)(basePath, options.scopeDir);
        }
        // Downstream code uses the basePath; we do not do that here.
        if (options.moduleTypes) {
            optionBasePaths.moduleTypes = basePath;
        }
        if (options.transpiler != null) {
            optionBasePaths.transpiler = basePath;
        }
        if (options.compiler != null) {
            optionBasePaths.compiler = basePath;
        }
        if (options.swc != null) {
            optionBasePaths.swc = basePath;
        }
        (0, util_1.assign)(tsNodeOptionsFromTsconfig, options);
    }
    // Remove resolution of "files".
    const files = rawApiOptions.files ?? tsNodeOptionsFromTsconfig.files ?? index_1.DEFAULTS.files;
    // Only if a config file is *not* loaded, load an implicit configuration from @tsconfig/bases
    const skipDefaultCompilerOptions = rootConfigPath != null;
    const defaultCompilerOptionsForNodeVersion = skipDefaultCompilerOptions
        ? undefined
        : {
            ...(0, tsconfigs_1.getDefaultTsconfigJsonForNodeVersion)(ts).compilerOptions,
            types: ['node'],
        };
    // Merge compilerOptions from all sources
    config.compilerOptions = Object.assign({}, 
    // automatically-applied options from @tsconfig/bases
    defaultCompilerOptionsForNodeVersion, 
    // tsconfig.json "compilerOptions"
    config.compilerOptions, 
    // from env var
    index_1.DEFAULTS.compilerOptions, 
    // tsconfig.json "ts-node": "compilerOptions"
    tsNodeOptionsFromTsconfig.compilerOptions, 
    // passed programmatically
    rawApiOptions.compilerOptions, 
    // overrides required by ts-node, cannot be changed
    TS_NODE_COMPILER_OPTIONS);
    const fixedConfig = fixConfig(ts, ts.parseJsonConfigFileContent(config, {
        fileExists,
        readFile,
        // Only used for globbing "files", "include", "exclude"
        // When `files` option disabled, we want to avoid the fs calls
        readDirectory: files ? ts.sys.readDirectory : () => [],
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    }, basePath, undefined, rootConfigPath));
    return {
        configFilePath: rootConfigPath,
        config: fixedConfig,
        tsNodeOptionsFromTsconfig,
        optionBasePaths,
    };
}
exports.readConfig = readConfig;
/**
 * Load the typescript compiler. It is required to load the tsconfig but might
 * be changed by the tsconfig, so we have to do this twice.
 * @internal
 */
function resolveAndLoadCompiler(name, relativeToPath) {
    const { compiler } = resolveCompiler(name, relativeToPath);
    const ts = loadCompiler(compiler);
    return { compiler, ts };
}
exports.resolveAndLoadCompiler = resolveAndLoadCompiler;
function resolveCompiler(name, relativeToPath) {
    const projectLocalResolveHelper = (0, util_1.createProjectLocalResolveHelper)(relativeToPath);
    const compiler = projectLocalResolveHelper(name || 'typescript', true);
    return { compiler };
}
/** @internal */
function loadCompiler(compiler) {
    return (0, util_1.attemptRequireWithV8CompileCache)(require, compiler);
}
exports.loadCompiler = loadCompiler;
/**
 * Given the raw "ts-node" sub-object from a tsconfig, return an object with only the properties
 * recognized by "ts-node"
 */
function filterRecognizedTsConfigTsNodeOptions(jsonObject) {
    if (jsonObject == null)
        return { recognized: {}, unrecognized: {} };
    const { compiler, compilerHost, compilerOptions, emit, files, ignore, ignoreDiagnostics, logError, preferTsExts, pretty, require, skipIgnore, transpileOnly, typeCheck, transpiler, scope, scopeDir, moduleTypes, experimentalReplAwait, swc, experimentalResolver, esm, experimentalSpecifierResolution, experimentalTsImportSpecifiers, ...unrecognized } = jsonObject;
    const filteredTsConfigOptions = {
        compiler,
        compilerHost,
        compilerOptions,
        emit,
        experimentalReplAwait,
        files,
        ignore,
        ignoreDiagnostics,
        logError,
        preferTsExts,
        pretty,
        require,
        skipIgnore,
        transpileOnly,
        typeCheck,
        transpiler,
        scope,
        scopeDir,
        moduleTypes,
        swc,
        experimentalResolver,
        esm,
        experimentalSpecifierResolution,
        experimentalTsImportSpecifiers,
    };
    // Use the typechecker to make sure this implementation has the correct set of properties
    const catchExtraneousProps = null;
    const catchMissingProps = null;
    return { recognized: filteredTsConfigOptions, unrecognized };
}
/** @internal */
exports.ComputeAsCommonRootOfFiles = Symbol();
/**
 * Some TS compiler options have defaults which are not provided by TS's config parsing functions.
 * This function centralizes the logic for computing those defaults.
 * @internal
 */
function getTsConfigDefaults(config, basePath, _files, _include, _exclude) {
    const { composite = false } = config.options;
    let rootDir = config.options.rootDir;
    if (rootDir == null) {
        if (composite)
            rootDir = basePath;
        // Return this symbol to avoid computing from `files`, which would require fs calls
        else
            rootDir = exports.ComputeAsCommonRootOfFiles;
    }
    const { outDir = rootDir } = config.options;
    // Docs are wrong: https://www.typescriptlang.org/tsconfig#include
    // Docs say **, but it's actually **/*; compiler throws error for **
    const include = _files ? [] : ['**/*'];
    const files = _files ?? [];
    // Docs are misleading: https://www.typescriptlang.org/tsconfig#exclude
    // Docs say it excludes node_modules, bower_components, jspm_packages, but actually those are excluded via behavior of "include"
    const exclude = _exclude ?? [outDir]; // TODO technically, outDir is absolute path, but exclude should be relative glob pattern?
    // TODO compute baseUrl
    return { rootDir, outDir, include, files, exclude, composite };
}
exports.getTsConfigDefaults = getTsConfigDefaults;
//# sourceMappingURL=configuration.js.map