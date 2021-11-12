# action-geekbot-to-github

Add content from Geekbot reports to a GitHub issue.

## Inputs

### `standup_id`

**Required** Unique identifier for a specific Geekbot standup. Available in the URL after opening a specific standup from the [Geekbot dashboard](https://app.geekbot.com/dashboard/), or via a `GET` request to https://api.geekbot.com/v1/standups/.

### `question_id`

**Required** Unique identifier for a specific question in a Geekbot standup. Available via a `GET` request to https://api.geekbot.com/v1/standups/.

### `owner`

**Optional** The owner of the repo containing the issue in which to comment. This is a GitHub username if the repo is user-owned, or a GitHub org name if the repo is org-owned. For example, `owner: smockle`. By default, `owner` is the owner of the repo containing the workflow running `smockle/action-geekbot-to-github`.

### `repo`

**Optional** The name of the repo containing the issue in which to comment. For example, `repo: action-geekbot-to-github`. By default, `repo` is the repo containing the workflow running `smockle/action-geekbot-to-github`.

### `issue_number`

**Required** The issue number for the issue in which to comment. For example, `issue_number: 1`.

## Environment Variables

### `GEEKBOT_API_KEY`

**Required** Geekbot API key. Available at https://app.geekbot.com/dashboard/api-webhooks.

### `GH_TOKEN`

**Required** A [GitHub token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the `public_repo` (for use in public repos) or `repo` (for use in private repos) scope.

## Example usage

```YAML
name: Geekbot to GitHub
on:
  # Run manually
  workflow_dispatch:
  # Run weekly (Thursday morning)
  schedule:
    - cron: "0 0 * * 4" # https://crontab.guru/#0_0_*_*_4

jobs:
  geekbot_to_github:
    name: Geekbot to GitHub
    runs-on: ubuntu-latest
    steps:
      - uses: smockle/action-geekbot-to-github@main
        with:
          standup_id: 10000
          question_id: 1000000
          owner: smockle
          repo: action-geekbot-to-github
          issue_number: 1
        env:
          GEEKBOT_API_KEY: ${{ secrets.GEEKBOT_API_KEY }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```
