const BaseCheck = require('./BaseCheck');

/**
 * Handle the PR title check
 */
class PRTitleCheck extends BaseCheck {

    /**
     * Construct the check
     *
     * @inheritDoc
     */
    constructor(context) {
        super(context, {
            name: 'PR Title Check',
            failureMessage: 'PR title does not match the pattern "<branch> <title>"',
        });
    }

    /**
     * Return the state of the check
     *
     * @returns {String|Boolean}
     */
    checkIsValid() {
        const pr = this.context.payload.pull_request;

        const branch = pr.head.ref;
        const branchRegex = /[A-Za-z]+\/([A-Za-z]+-[0-9]+)/;

        // If it's not a task branch we'll allow it
        if (!new RegExp(branchRegex).test(branch)) {
            return true;
        }

        const [_, branchIssue] = new RegExp(branchRegex).exec(branch);
        const normalisedBranch = branch.toLowerCase();
        const normalisedBranchIssue = (branchIssue || '').toLowerCase();
        this.branchIssue = branchIssue;

        const { title } = pr;
        const normalisedTitle = title.toLowerCase();
        const titleDescription = normalisedTitle
            .replace(normalisedBranch, '')
            .replace(normalisedBranchIssue, '')
            .trim();

        const hasIssueDescriptor = (
            !branchIssue // Not required if we don't have an issue branch
            || normalisedTitle.startsWith(normalisedBranch) // Matches "task/ABC-123 Updated foo bar"
            || normalisedTitle.startsWith(normalisedBranchIssue) // Matches "ABC-123 Updated foo bar"
        );

        if (!hasIssueDescriptor) {
            return `Title does not contain issue descriptor (${ branch } or ${ branchIssue })`;
        }

        if (!titleDescription) {
            return 'Title description not provided.';
        }

        return true;
    }

    /**
     * Comment on the PR after the status has been set
     *
     * @inheritDoc
     */
    async afterStatus({ data }) {
        if (data.state !== 'failure') {
            return;
        }

        const branch = this.branchIssue || 'task/ABC-123';
        const { user } = this.context.payload.pull_request;

        const comment = this.context.issue({
            body: `
Hi there @${ user.login }! It looks like the title of this PR doesn't quite match our guidelines. 

Make sure your PR titles follow the format of \`<Jira Issue> <Description>\`

For example: \`${ branch } Adds contact form to the homepage\`
            `,
        });

        await this.context.github.issues.createComment(comment);
    }
}

module.exports = PRTitleCheck;
