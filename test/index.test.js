const nock = require('nock');
// Requiring our app implementation
const myProbotApp = require('..');
const { Probot } = require('probot');

// Event response payloads
const taskAndDescriptionPayload = require('./events/task-and-description');
const shortHandTaskPayload = require('./events/shorthand-task');
const noIssuePayload = require('./events/no-issue');
const noDescriptionPayload = require('./events/no-description');

nock.disableNetConnect();

describe('PR Title Checker', () => {
    let probot;

    beforeEach(() => {
        probot = new Probot({});
        // Load our app into probot
        const app = probot.load(myProbotApp);

        // just return a test token
        app.app = () => 'test';
    });

    // Test that we correctly return a test token
    nock('https://api.github.com')
        .post('/app/installations/473761/access_tokens')
        .reply(200, { token: 'test' });

    test('Ensures an issue descriptor is provided', async() => {
        nock('https://api.github.com')
            .post(`/repos/samturrell/probot-tests/statuses/${ noIssuePayload.pull_request.head.sha }`, ({ state }) => {
                expect(state).toBe('failure');

                return true;
            })
            .reply(200);

        // Receive a webhook event
        await probot.receive({
            name: 'pull_request.opened',
            payload: noIssuePayload,
        });
    });

    test('Ensures a description is provided', async() => {
        nock('https://api.github.com')
            .post(`/repos/samturrell/probot-tests/statuses/${ noDescriptionPayload.pull_request.head.sha }`, ({ state }) => {
                expect(state).toBe('failure');

                return true;
            })
            .reply(200);

        // Receive a webhook event
        await probot.receive({
            name: 'pull_request.opened',
            payload: noDescriptionPayload,
        });
    });

    test('Ensures a check passes when the title contains issue and description', async() => {
        nock('https://api.github.com')
            .post(`/repos/samturrell/probot-tests/statuses/${ taskAndDescriptionPayload.pull_request.head.sha }`, ({ state }) => {
                expect(state).toBe('success');

                return true;
            })
            .reply(200);

        // Receive a webhook event
        await probot.receive({
            name: 'pull_request.opened',
            payload: taskAndDescriptionPayload,
        });
    });

    test('Ensures a check passes when the title contains a shorthand issue and description', async() => {
        nock('https://api.github.com')
            .post(`/repos/samturrell/probot-tests/statuses/${ shortHandTaskPayload.pull_request.head.sha }`, ({ state }) => {
                expect(state).toBe('success');

                return true;
            })
            .reply(200);

        // Receive a webhook event
        await probot.receive({
            name: 'pull_request.opened',
            payload: shortHandTaskPayload,
        });
    });
});

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
