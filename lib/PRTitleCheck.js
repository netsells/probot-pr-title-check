const BaseCheck = require('./BaseCheck');

/**
 * Handle the PR title check
 */
class PRTitleCheck extends BaseCheck {

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

        const title = pr.title;
        const normalisedTitle = title.toLowerCase();

        const branch = pr.head.ref;
        let branchIssue = branch.split('/')[1];
        // Sometimes branches have reference descriptions e.g. task/ABC-123-account-area
        // So we have to account for this and strip it out
        const issueRefIndex = branchIssue.indexOf('-', branchIssue.indexOf('-'));
        if (issueRefIndex) {
            branchIssue = branchIssue.substring(0, issueRefIndex);
        }
        const normalisedBranch = branch.toLowerCase();
        const normalisedBranchIssue = branchIssue.toLowerCase();

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
}

module.exports = PRTitleCheck;
