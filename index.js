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
    if (!githubToken) {
      throw new Error(
        "Failed to retrieve a GitHub token. Does this repository have a secret named 'GH_TOKEN'? https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository"
      );
    }
    const geekbotAPIKey = process.env.GEEKBOT_API_KEY;
    if (!geekbotAPIKey) {
      throw new Error(
        "Failed to retrieve a Geekbot API key. Does this repository have a secret named 'GEEKBOT_API_KEY'? https://docs.github.com/en/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository"
      );
    }
    const standupId = core.getInput("standup_id", { required: true });
    if (!standupId) {
      throw new Error(
        "Failed to retrieve the standup id. Does the workflow include 'standupId'?"
      );
    }
    const questionId = core.getInput("question_id", { required: true });
    if (!questionId) {
      throw new Error(
        "Failed to retrieve the question id. Does the workflow include 'questionId'?"
      );
    }
    const owner =
      core.getInput("owner") || github.context.payload.repository?.owner?.login;
    if (!owner) {
      throw new Error(
        `Failed to retrieve 'owner' or to determine it from context ('repository' in 'context': ${github.context.payload.repository}).`
      );
    }
    const repo =
      core.getInput("repo") || github.context.payload.repository?.name;
    if (!repo) {
      throw new Error(
        `Failed to retrieve 'repo' or to determine it from context ('repository' in 'context': ${github.context.payload.repository}).`
      );
    }
    const issueNumber = core.getInput("issue_number", { required: true });
    if (!issueNumber) {
      throw new Error(
        "Failed to retrieve the question id. Does the workflow include 'issueNumber'?"
      );
    }

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
    const json = await response.json();
    if (!json) {
      throw new Error(
        `Failed to fetch reports matching standup ${standupId} and question ${questionId}.`
      );
    }

    // Omit reports which didn’t answer the question
    const reports = json.reduce((reports, report) => {
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
      if (username === smockle) {
        body += `- @${username}: ${ship}\n`;
      }
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
