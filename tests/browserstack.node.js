// npm install --no-save selenium-webdriver
// touch browserstackCreds.json
// open https://automate.browserstack.com/dashboard/v2/

const webdriver = require("selenium-webdriver")
const { userName, accessKey } = require("../ignore/browserstackCreds.json")
const { version } = require("../package.json")

const browserstackURL = "https://" + userName + ":" + accessKey + "@hub-cloud.browserstack.com/wd/hub"

const homePageUrl = "https://scroll.pub"

async function runTestWithCaps(capabilities) {
  try {
    let driver = new webdriver.Builder()
      .usingServer(`http://${userName}:${accessKey}@hub-cloud.browserstack.com/wd/hub`)
      .withCapabilities(capabilities)
      .build()
    await driver.get(homePageUrl)
    try {
      await driver.wait(webdriver.until.titleMatches(/Scroll/i), 5000)
      const title = await driver.getTitle()
      const message = `${title} v${version} loaded on ${capabilities.browserName} on ${capabilities.device ?? capabilities.os}`
      console.log(message)
      await driver.executeScript(`browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"passed","reason": "${message}"}}`)
    } catch (err) {
      console.error(err)
      await driver.executeScript('browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"failed","reason": "Page could not load in time"}}')
    }
    await driver.quit()
  } catch (err) {
    console.error(err)
  }
}
const build = `Scroll v${version}`
const capabilities1 = {
  browserName: "chrome",
  browser_version: "latest",
  os: "Windows",
  os_version: "10",
  build,
  name: "Parallel test 1"
}
const capabilities2 = {
  browserName: "firefox",
  browser_version: "latest-beta",
  os: "Windows",
  os_version: "10",
  build,
  name: "Parallel test 2"
}
const capabilities3 = {
  device: "iPhone 12 Pro",
  browserName: "iPhone",
  os_version: "14",
  real_mobile: "true",
  build,
  name: "Parallel test 3"
}
const capabilities4 = {
  device: "Samsung Galaxy S21",
  browserName: "Android",
  os_version: "11.0",
  real_mobile: "true",
  build,
  name: "Parallel test 4"
}
const capabilities5 = {
  browserName: "Safari",
  browser_version: "latest",
  os: "OS X",
  os_version: "Big Sur",
  build,
  name: "Parallel test 5"
}
// The following code invokes the test function 5 times in parallel with separate capabilities as defined above
runTestWithCaps(capabilities1)
runTestWithCaps(capabilities2)
runTestWithCaps(capabilities3)
runTestWithCaps(capabilities4)
runTestWithCaps(capabilities5)
