import * as core from '@actions/core'
import * as fs from 'fs'
import * as path from 'path'
import {parseString} from 'xml2js'

class CheckstyleObject {
  file: string
  line: string
  column: string
  severity: string
  message: string

  constructor(
    file: string,
    line: string,
    column: string,
    severity: string,
    message: string
  ) {
    this.file = file
    this.line = line
    this.column = column
    this.severity = severity
    this.message = message
  }
}

async function run(): Promise<void> {
  try {
    core.startGroup(`📘 Reading input values`)

    const runnerWorkspace: string = process.env[`RUNNER_WORKSPACE`] || ''
    const repoName: string = (process.env[`GITHUB_REPOSITORY`] || '').split(
      '/'
    )[1]
    const gitWorkspace = process.env[`GITHUB_WORKSPACE`] || ''

    let lintXmlFile: string = 'lint-results-release.xml' //core.getInput("lint_xml_file");

    if (!lintXmlFile) {
      core.setFailed('❌ No lint file specified')
      return
    }

    lintXmlFile = path.join(gitWorkspace, lintXmlFile)

    if (!fs.existsSync(lintXmlFile)) {
      core.setFailed(
        `❌ Invalid file specified. Specified path is ${fs.realpathSync(
          lintXmlFile
        )}`
      )
      return
    }

    core.endGroup()

    core.startGroup(`📦 Process lint report content`)

    const lintXmlFileContents = fs.readFileSync(lintXmlFile, 'utf8')

    parseString(lintXmlFileContents, function (error, result) {
      if (error) {
        core.setFailed(`❌ There was an error when parsing: ${error}`)
      } else {
        let xml = '<?xml version="1.0" encoding="utf-8"?>'
        xml += '\n<checkstyle version="8.0">'

        const issuesCount = result['issues']['issue'].length

        core.info(`Retrieved ${issuesCount} issues to process.`)

        const checkstyleData: CheckstyleObject[] = []

        for (let i = 0; i < issuesCount; i++) {
          const currentObject = result['issues']['issue'][i]
          for (let key in currentObject) {
            if (currentObject.hasOwnProperty(key)) {
              const issue = currentObject['$']
              const location = currentObject['location'][0]['$']
              const file = escape(
                location.file.replace(`${runnerWorkspace} /${repoName}`, '')
              )
              const line = escape(location.line)
              const column = escape(location.column)
              const severity = escape(issue.severity)
              const message = escape(`${issue.id}: ${issue.message}`)

              checkstyleData.push(
                new CheckstyleObject(file, line, column, severity, message)
              )
            }
          }
        }

        const grouped = checkstyleData.reduce(function (r, a) {
          r[a.file] = r[a.file] || []
          r[a.file].push(a)
          return r
        }, Object.create(null))

        Object.keys(grouped).forEach(key => {
          xml += `\n<file name="${key}">`
          grouped[key].forEach((object: CheckstyleObject) => {
            xml += `\n<error line="${object.line}" column="${object.column}" severity="${object.severity}" message="${object.message}" />`
          })
          xml += '\n</file>'
        })

        xml += '\n</checkstyle>'

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
