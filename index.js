#!/usr/bin/env node
const fetch = require("node-fetch");
const { URL } = require("url");
const core = require("@actions/core");
const github = require("@actions/github");

const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;

(async () => {
  try {
    // Retrieve required environment variables and inputs
    const githubToken = process.env.GH_TOKEN;
    const geekbotAPIKey = process.env.GEEKBOT_API_KEY;
    const standupId = core.getInput("standup_id", { required: true });
    const questionId = core.getInput("question_id", { required: true });
    const owner =
      core.getInput("owner") || github.context.payload.repository?.owner?.login;
    const repo =
      core.getInput("repo") || github.context.payload.repository?.name;
    const issueNumber = core.getInput("issue_number", { required: true });

    // Fetch reports within the last week for the specific standup and question
    const response = await fetch(
      new URL(
        `https://api.geekbot.com/v1/reports/?${new URLSearchParams({
          standup_id: standupId,
          question_ids: questionId,
          after: Math.floor((Date.now() - weekInMilliseconds) / 1000), // Geekbot’s API expects seconds
        }).toString()}`
      ),
      {
        headers: {
          Authorization: geekbotAPIKey,
        },
      }
    );

    // Omit reports which didn’t answer the question
    const reports = (await response.json()).reduce((reports, report) => {
      if (report.questions.length > 0) {
        reports[report.member.username] = report.questions[0].answer;
      }
      return reports;
    }, {});
    if (Object.entries(reports).length === 0) {
      console.log(
        `Question ${questionId} from standup ${standupId} was not answered within the last week.`
      );
      return;
    }

    // Format reports
    const body = Object.entries(reports).reduce((body, [username, ship]) => {
      body += `- @${username} shipped ${ship}\n`;
      return body;
    }, "");

    // Comment on the specified GitHub issue
    github.getOctokit(githubToken).rest.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
})();
