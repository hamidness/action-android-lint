"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var fs = require("fs");
var xml2js_1 = require("xml2js");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var lintXmlFile, workspace_1, repoName_1, lintXmlFileContents;
        return __generator(this, function (_a) {
            try {
                core.startGroup("\uD83D\uDCD8 Reading input values");
                lintXmlFile = core.getInput("lint_xml_file");
                if (!lintXmlFile) {
                    core.setFailed("❌ No lint file specified");
                    return [2 /*return*/];
                }
                if (!fs.existsSync(lintXmlFile)) {
                    core.setFailed("❌ Invalid file specified");
                    return [2 /*return*/];
                }
                core.endGroup();
                workspace_1 = process.env["RUNNER_WORKSPACE"] || "";
                repoName_1 = (process.env["GITHUB_REPOSITORY"] || "").split('/')[1];
                core.debug("Runner workspace is " + workspace_1);
                core.debug("Repo name is " + repoName_1);
                core.startGroup("\uD83D\uDCE6 Process lint report content");
                lintXmlFileContents = fs.readFileSync(lintXmlFile, 'utf8');
                (0, xml2js_1.parseString)(lintXmlFileContents, function (error, result) {
                    if (error) {
                        core.setFailed('❌ There was an error when parsing: ' + error);
                    }
                    else {
                        var xml = '<?xml version="1.0" encoding="utf-8"?>';
                        xml += '\n<checkstyle version="8.0">';
                        var issuesCount = result["issues"]["issue"].length;
                        core.info("Retrieved ".concat(issuesCount, " issues to process."));
                        for (var i = 0; i < issuesCount; i++) {
                            var currentObject = result["issues"]["issue"][i];
                            for (var key in currentObject) {
                                if (currentObject.hasOwnProperty(key)) {
                                    var issue = currentObject["$"];
                                    var issueMessage = issue.id + ": " + issue.message;
                                    var location_1 = currentObject["location"][0]["$"];
                                    xml += '\n<file name="' + escape(location_1.file.replace(workspace_1 + "/" + repoName_1, "")) + '">';
                                    xml += '\n<error line="' + escape(location_1.line) + '" ';
                                    xml += 'column="' + escape(location_1.column) + '" ';
                                    xml += 'severity="' + escape(issue.severity) + '" ';
                                    xml += 'message="' + escape(issueMessage) + '" ';
                                    xml += '/>';
                                    xml += '\n</file>';
                                }
                            }
                        }
                        xml += '\n</checkstyle>';
                        core.startGroup("\uD83D\uDE80 Checkstyle output is ready to be served!");
                        core.setOutput('output_checkstyle', xml);
                        core.endGroup();
                    }
                });
            }
            catch (error) {
                if (error instanceof Error)
                    core.setFailed(error.message);
            }
            return [2 /*return*/];
        });
    });
}
run();
