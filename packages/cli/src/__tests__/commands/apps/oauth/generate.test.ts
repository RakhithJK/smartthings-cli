import { inputAndOutputItem } from '@smartthings/cli-lib'
import { GenerateAppOAuthRequest, AppsEndpoint } from '@smartthings/core-sdk'
import AppOauthGenerateCommand from '../../../../commands/apps/oauth/generate'
import { chooseApp } from '../../../../lib/commands/apps-util'


jest.mock('../../../../lib/commands/apps-util')

describe('AppOauthGenerateCommand', () => {
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockChooseApp = jest.mocked(chooseApp)
	const regenerateSpy = jest.spyOn(AppsEndpoint.prototype, 'regenerateOauth').mockImplementation()

	beforeAll(() => {
		mockInputAndOutputItem.mockImplementation()
	})

	it('prompts user to choose app', async () => {
		await expect(AppOauthGenerateCommand.run([])).resolves.not.toThrow()

		expect(mockChooseApp).toBeCalledWith(expect.any(AppOauthGenerateCommand), undefined)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(AppOauthGenerateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(AppOauthGenerateCommand),
			expect.objectContaining({
				tableFieldDefinitions: expect.arrayContaining(['oauthClientId', 'oauthClientSecret']),
			}),
			expect.any(Function),
		)
	})

	it('uses correct endpoint to generate oauth', async () => {
		const appId = 'appId'
		const oAuth = { clientName: 'test' } as GenerateAppOAuthRequest
		mockChooseApp.mockResolvedValueOnce(appId)
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, oAuth)
		})

		await expect(AppOauthGenerateCommand.run([appId])).resolves.not.toThrow()

		expect(regenerateSpy).toBeCalledWith(appId, oAuth)
	})
})
