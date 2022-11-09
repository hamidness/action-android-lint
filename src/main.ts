import * as core from '@actions/core'
import * as fs from 'fs';
import * as path from 'path';
import {parseString} from 'xml2js';


async function run(): Promise<void> {
    try {
        core.startGroup(`📘 Reading input values`)

        const runnerWorkspace: string = process.env[`RUNNER_WORKSPACE`] || "";
        const repoName: string = (process.env[`GITHUB_REPOSITORY`] || "").split('/')[1];
        const gitWorkspace = process.env[`GITHUB_WORKSPACE`] || "";

        let lintXmlFile: string = core.getInput("lint_xml_file");

        if (!lintXmlFile) {
            core.setFailed("❌ No lint file specified")
            return
        }

        lintXmlFile = path.join(gitWorkspace, lintXmlFile)

        if (!fs.existsSync(lintXmlFile)) {
            core.setFailed(`❌ Invalid file specified. Specified path is ${fs.realpathSync(lintXmlFile)}`)
            return
        }

        core.debug(`Runner workspace is ${runnerWorkspace}`);
        core.debug(`Repo name is  ${repoName}`);
        core.debug(`File path is  ${fs.realpathSync(lintXmlFile)} and exists? ${fs.existsSync(lintXmlFile)}`);

        core.endGroup()

        core.startGroup(`📦 Process lint report content`)

        const lintXmlFileContents = fs.readFileSync(lintXmlFile, 'utf8');

        parseString(lintXmlFileContents, function (error, result) {
            if (error) {
                core.setFailed(`❌ There was an error when parsing: ${error}`);
            } else {
                let xml = '<?xml version="1.0" encoding="utf-8"?>';
                xml += '\n<checkstyle version="8.0">';

                const issuesCount = result["issues"]["issue"].length

                core.info(`Retrieved ${issuesCount} issues to process.`)

                for (let i = 0; i < issuesCount; i++) {
                    const currentObject = result["issues"]["issue"][i];
                    for (let key in currentObject) {
                        if (currentObject.hasOwnProperty(key)) {
                            const issue = currentObject["$"]
                            const issueMessage = issue.id + ": " + issue.message
                            const location = currentObject["location"][0]["$"];
                            xml += `\n<file name="${escape(location.file.replace(runnerWorkspace + "/" + repoName, ""))}">`;
                            xml += `\n<error line="${escape(location.line)}" `;
                            xml += `column="${escape(location.column)}" `;
                            xml += `severity="${escape(issue.severity)}" `;
                            xml += `message="${escape(issueMessage)}" `;
                            xml += '/>';
                            xml += '\n</file>';
                        }
                    }
                }
                xml += '\n</checkstyle>';
                core.startGroup(`🚀 Checkstyle output is ready to be served!`)
                core.setOutput('output_checkstyle', xml)
                core.endGroup()
            }
        })
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
